import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../services/supabase';

interface ExerciseSet {
  reps: number;
  weight: number;
}

interface SessionExercise {
  exercise_id: string;
  name: string;
  muscle_group: string;
  sets: ExerciseSet[];
}

export default function LogWorkoutScreen() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [newSetReps, setNewSetReps] = useState<{[key: string]: string}>({});
  const [newSetWeight, setNewSetWeight] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');
    if (error) {
      console.error('Error fetching exercises:', error);
    } else {
      setExercises(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (searchQuery) {
      setFilteredExercises(
        exercises.filter(exercise =>
          exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchQuery, exercises]);

  // Session-based workout builder functions
  const addExerciseToSession = (exercise: any) => {
    const existingExercise = sessionExercises.find(ex => ex.exercise_id === exercise.id);
    if (!existingExercise) {
      setSessionExercises([...sessionExercises, {
        exercise_id: exercise.id,
        name: exercise.name,
        muscle_group: exercise.muscle_group,
        sets: []
      }]);
    }
  };

  const removeExerciseFromSession = (exerciseId: string) => {
    setSessionExercises(sessionExercises.filter(ex => ex.exercise_id !== exerciseId));
    // Clean up new set inputs
    const newReps = { ...newSetReps };
    const newWeight = { ...newSetWeight };
    delete newReps[exerciseId];
    delete newWeight[exerciseId];
    setNewSetReps(newReps);
    setNewSetWeight(newWeight);
  };

  const addSetToExercise = (exerciseId: string) => {
    const reps = parseInt(newSetReps[exerciseId] || '0');
    const weight = parseFloat(newSetWeight[exerciseId] || '0');
    
    if (reps > 0 && weight > 0) {
      setSessionExercises(sessionExercises.map(ex => {
        if (ex.exercise_id === exerciseId) {
          return {
            ...ex,
            sets: [...ex.sets, { reps, weight }]
          };
        }
        return ex;
      }));
      
      // Clear inputs for this exercise
      setNewSetReps({ ...newSetReps, [exerciseId]: '' });
      setNewSetWeight({ ...newSetWeight, [exerciseId]: '' });
    } else {
      Alert.alert('Error', 'Please enter valid reps and weight values');
    }
  };

  const removeSetFromExercise = (exerciseId: string, setIndex: number) => {
    setSessionExercises(sessionExercises.map(ex => {
      if (ex.exercise_id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter((_, index) => index !== setIndex)
        };
      }
      return ex;
    }));
  };

  const toggleExerciseExpanded = (exerciseId: string) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exerciseId)) {
      newExpanded.delete(exerciseId);
    } else {
      newExpanded.add(exerciseId);
    }
    setExpandedExercises(newExpanded);
  };

  const validateSession = () => {
    if (sessionExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise to your workout');
      return false;
    }
    
    const hasValidSets = sessionExercises.some(exercise => exercise.sets.length > 0);
    if (!hasValidSets) {
      Alert.alert('Error', 'Please add at least one set to an exercise');
      return false;
    }
    
    return true;
  };

  const saveWorkoutSession = async () => {
    if (!validateSession()) return;

    setSaving(true);

    try {
      // Get today's start and end timestamps
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Use date-only format to avoid timezone issues
      const startOfDayString = startOfDay.toISOString().split('T')[0] + ' 00:00:00';
      const endOfDayString = endOfDay.toISOString().split('T')[0] + ' 23:59:59';
      
      console.log('Searching for workouts between:', startOfDayString, 'and', endOfDayString);
      
      // Check if workout already exists for today using date range
      const { data: existingWorkout, error: fetchError } = await supabase
        .from('workouts')
        .select('*')
        .gte('created_at', startOfDayString)
        .lte('created_at', endOfDayString)
        .single();

      let workoutId;
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // No workout exists for today, create new one
        console.log('No workout found for today, creating new workout');
        // Create date without time to avoid timezone issues completely
        const today = new Date().toISOString().split('T')[0];
        const dateTimeString = `${today} 00:00:00`;
        console.log('Creating workout with date only:', dateTimeString);
        
        const { data: newWorkout, error: createError } = await supabase
          .from('workouts')
          .insert([{ created_at: dateTimeString }])
          .select()
          .single();

        if (createError) throw createError;
        workoutId = newWorkout.id;
      } else if (fetchError) {
        throw fetchError;
      } else {
        // Use existing workout
        console.log('Using existing workout for today:', existingWorkout);
        workoutId = existingWorkout.id;
      }

      // Create all workout entries for the session
      const workoutEntries: any[] = [];
      sessionExercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          workoutEntries.push({
            workout_id: workoutId,
            exercise_id: exercise.exercise_id,
            sets: 1, // Each entry represents one set
            reps: set.reps,
            weight: set.weight
          });
        });
      });

      const { error: entryError } = await supabase
        .from('workout_entries')
        .insert(workoutEntries);

      if (entryError) throw entryError;

      Alert.alert('Success', 'Workout session saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset session
            setSessionExercises([]);
            setExpandedExercises(new Set());
            setNewSetReps({});
            setNewSetWeight({});
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving workout session:', error);
      Alert.alert('Error', 'Failed to save workout session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Workout Builder
        </Text>
        
        <TextInput
          style={{
            height: 40,
            borderColor: '#ddd',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            marginBottom: 20,
            fontSize: 16,
          }}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <Text>Loading...</Text>
        ) : filteredExercises.length === 0 ? (
          <Text>No exercises found</Text>
        ) : (
          filteredExercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              onPress={() => addExerciseToSession(ex)}
              style={{
                padding: 15,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
                backgroundColor: sessionExercises.some(se => se.exercise_id === ex.id) ? '#e3f2fd' : 'white',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 5 }}>
                {ex.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {ex.muscle_group || 'No muscle group'}
              </Text>
              {sessionExercises.some(se => se.exercise_id === ex.id) && (
                <Text style={{ fontSize: 12, color: '#007AFF', marginTop: 5 }}>
                  ✓ Added to session
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Session Exercises Section */}
        {sessionExercises.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
              Your Workout Session
            </Text>
            
            {sessionExercises.map((exercise) => (
              <View key={exercise.exercise_id} style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                marginBottom: 15,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleExerciseExpanded(exercise.exercise_id)}
                  style={{
                    padding: 15,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#e9ecef',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                      {exercise.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      {exercise.muscle_group} • {exercise.sets.length} sets
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#007AFF', marginRight: 10 }}>
                      {expandedExercises.has(exercise.exercise_id) ? '▼' : '▶'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeExerciseFromSession(exercise.exercise_id)}
                      style={{ backgroundColor: '#dc3545', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                    >
                      <Text style={{ color: 'white', fontSize: 12 }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {expandedExercises.has(exercise.exercise_id) && (
                  <View style={{ padding: 15 }}>
                    {/* Existing Sets */}
                    {exercise.sets.map((set, index) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#dee2e6',
                      }}>
                        <Text>Set {index + 1}</Text>
                        <Text>{set.reps} reps × {set.weight}kg</Text>
                        <TouchableOpacity
                          onPress={() => removeSetFromExercise(exercise.exercise_id, index)}
                          style={{ backgroundColor: '#dc3545', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}
                        >
                          <Text style={{ color: 'white', fontSize: 10 }}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add New Set */}
                    <View style={{ marginTop: 15 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                        Add Set
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <TextInput
                          style={{
                            flex: 1,
                            height: 40,
                            borderColor: '#ddd',
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            marginRight: 10,
                            textAlign: 'center',
                          }}
                          placeholder="Reps"
                          keyboardType="numeric"
                          value={newSetReps[exercise.exercise_id] || ''}
                          onChangeText={(value) => setNewSetReps({ ...newSetReps, [exercise.exercise_id]: value })}
                        />
                        <TextInput
                          style={{
                            flex: 1,
                            height: 40,
                            borderColor: '#ddd',
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            textAlign: 'center',
                          }}
                          placeholder="Weight (kg)"
                          keyboardType="numeric"
                          value={newSetWeight[exercise.exercise_id] || ''}
                          onChangeText={(value) => setNewSetWeight({ ...newSetWeight, [exercise.exercise_id]: value })}
                        />
                      </View>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#007AFF',
                          paddingVertical: 8,
                          borderRadius: 6,
                          alignItems: 'center',
                        }}
                        onPress={() => addSetToExercise(exercise.exercise_id)}
                      >
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                          Add Set
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Save Session Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#28a745',
                paddingVertical: 15,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 20,
              }}
              onPress={saveWorkoutSession}
              disabled={saving}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                {saving ? 'Saving Session...' : 'Save Workout Session'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}