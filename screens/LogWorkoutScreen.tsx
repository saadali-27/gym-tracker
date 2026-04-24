import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

interface Routine {
  id: string;
  name: string;
}

interface ExerciseSet {
  reps: string;
  weight: string;
}

interface SessionExercise {
  exercise_id: string;
  name: string;
  muscle_group: string;
  sets: ExerciseSet[];
}

interface WorkoutEntry {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight: number;
}

export default function LogWorkoutScreen() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [newSetReps, setNewSetReps] = useState<{[key: string]: string}>({});
  const [newSetWeight, setNewSetWeight] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<string>('');
  const [showRoutineDropdown, setShowRoutineDropdown] = useState(false);
  const [routineLoaded, setRoutineLoaded] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchExercises();
      fetchRoutines();
    }, [])
  );

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');
    if (error) {
      console.error('Error fetching exercises:', error);
    } else {
      setExercises(data);
    }
  };

  const fetchRoutines = async () => {
    console.log('🔍 FETCHING ROUTINES FOR LOG WORKOUT');
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('❌ ERROR fetching routines:', error);
      } else {
        console.log('✅ ROUTINES FETCHED:', data);
        console.log('✅ ROUTINES COUNT:', data?.length || 0);
        setRoutines(data || []);
      }
    } catch (error) {
      console.error('❌ ERROR:', error);
    } finally {
      setLoading(false);
    }
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

  // Routine functions
  const loadRoutineExercises = async (routineId: string) => {
    console.log('🔍 LOADING ROUTINE EXERCISES FOR ROUTINE:', routineId);
    
    try {
      // Fetch exercises from routine_exercises with join to exercises table
      const { data, error } = await supabase
        .from('routine_exercises')
        .select(`
          exercise_id,
          exercises (
            id,
            name,
            muscle_group
          )
        `)
        .eq('routine_id', routineId);

      if (error) {
        console.error('❌ ERROR fetching routine exercises:', error);
        Alert.alert('Error', 'Failed to load routine exercises');
        return;
      }

      console.log('📥 ROUTINE EXERCISES RESPONSE:', data);

      // Format exercises into workout input format
      const routineExercises: SessionExercise[] = data?.map((re: any) => ({
        exercise_id: re.exercise_id,
        name: re.exercises?.name || 'Unknown Exercise',
        muscle_group: re.exercises?.muscle_group || 'Unknown',
        sets: [] // Start with empty sets as required
      })).filter(exercise => exercise.name !== 'Unknown Exercise') || [];

      console.log('✅ FORMATTED ROUTINE EXERCISES:', routineExercises);

      // Add exercises to session, avoiding duplicates
      const newSessionExercises = [...sessionExercises];
      routineExercises.forEach(routineExercise => {
        const exists = newSessionExercises.find(ex => ex.exercise_id === routineExercise.exercise_id);
        if (!exists) {
          newSessionExercises.push(routineExercise);
        }
      });

      setSessionExercises(newSessionExercises);
      
      // Auto-expand all loaded exercises
      const newExpanded = new Set(expandedExercises);
      routineExercises.forEach(exercise => {
        newExpanded.add(exercise.exercise_id);
      });
      setExpandedExercises(newExpanded);
      
      Alert.alert('Routine Loaded', `Routine loaded — log your sets\n\n${routineExercises.length} exercises ready`);
    } catch (error) {
      console.error('❌ ERROR loading routine exercises:', error);
      Alert.alert('Error', 'Failed to load routine');
    }
  };

  const clearRoutine = () => {
    setSelectedRoutine('');
    setRoutineLoaded(false);
    setShowRoutineDropdown(false);
    // Clear only routine-loaded exercises (optional, or keep all exercises)
    // For now, just clear the routine selection
  };

  const handleRoutineSelect = (routineId: string) => {
    console.log('🎯 ROUTINE SELECTED:', routineId);
    setSelectedRoutine(routineId);
    setShowRoutineDropdown(false);
    
    if (routineId) {
      console.log('📥 LOADING ROUTINE EXERCISES...');
      loadRoutineExercises(routineId);
      setRoutineLoaded(true);
    } else {
      console.log('🔄 CLEARING ROUTINE SELECTION');
      setRoutineLoaded(false);
    }
  };

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
    // Add empty set that user can fill in
    setSessionExercises(sessionExercises.map(ex => {
      if (ex.exercise_id === exerciseId) {
        return {
          ...ex,
          sets: [...ex.sets, { reps: '', weight: '' }]
        };
      }
      return ex;
    }));
  };

  const updateSetValues = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: string) => {
    setSessionExercises(sessionExercises.map(ex => {
      if (ex.exercise_id === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          [field]: value
        };
        return {
          ...ex,
          sets: updatedSets
        };
      }
      return ex;
    }));
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
    
    // Check if any exercise has at least one valid set (with reps > 0 and weight >= 0)
    const hasValidSets = sessionExercises.some(exercise => 
      exercise.sets.some(set => {
        const reps = parseInt(set.reps) || 0;
        const weight = parseFloat(set.weight) || 0;
        return reps > 0 && weight >= 0;
      })
    );
    
    if (!hasValidSets) {
      Alert.alert('Error', 'Please add at least one complete set with valid reps and weight');
      return false;
    }
    
    return true;
  };

  const saveWorkoutSession = async () => {
  if (!validateSession()) return;

  setSaving(true);

  try {
    const now = new Date();

    const localDateString =
      now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    console.log("Creating new workout with routine_id:", selectedRoutine);
    const { data: newWorkout, error: createError } = await supabase
      .from('workouts')
      .insert({
        date: localDateString,
        routine_id: selectedRoutine || null,
      })
      .select()
      .single();

    if (createError) throw createError;

    const workoutId = newWorkout.id;

    // Save sets
    const workoutEntries: WorkoutEntry[] = [];

    sessionExercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const reps = parseInt(set.reps) || 0;
        const weight = parseFloat(set.weight) || 0;

        if (reps > 0 && weight >= 0) {
          workoutEntries.push({
            workout_id: workoutId,
            exercise_id: exercise.exercise_id,
            sets: 1,
            reps,
            weight,
          });
        }
      });
    });

    const { error: entryError } = await supabase
      .from('workout_entries')
      .insert(workoutEntries);

    if (entryError) throw entryError;

    Alert.alert('Success', 'Workout saved!', [
      {
        text: 'OK',
        onPress: () => {
          setSessionExercises([]);
          setExpandedExercises(new Set());
          setNewSetReps({});
          setNewSetWeight({});
        },
      },
    ]);

  } catch (error) {
    console.error('Error saving workout:', error);
    Alert.alert('Error', 'Failed to save workout');
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
        
        {/* Routine Selection */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              Select Routine (Optional)
            </Text>
            {routineLoaded && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#ef4444',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
                onPress={clearRoutine}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                  Clear Routine
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {routineLoaded && (
            <View style={{
              backgroundColor: '#f0f9ff',
              borderColor: '#3b82f6',
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}>
              <Text style={{ color: '#1e40af', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
                💪 Routine loaded — log your sets below
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={{
              height: 40,
              borderColor: routineLoaded ? '#3b82f6' : '#ddd',
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              justifyContent: 'center',
              backgroundColor: routineLoaded ? '#eff6ff' : '#fff',
            }}
            onPress={() => setShowRoutineDropdown(!showRoutineDropdown)}
          >
            <Text style={{ fontSize: 16, color: selectedRoutine ? '#1e40af' : '#999' }}>
              {selectedRoutine 
                ? routines.find(r => r.id === selectedRoutine)?.name || 'Select Routine'
                : 'Select Routine'
              }
            </Text>
          </TouchableOpacity>
          
          {showRoutineDropdown && (
            <View style={{
              position: 'absolute',
              top: 70,
              left: 20,
              right: 20,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              maxHeight: 200,
              zIndex: 1000,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}>
              <ScrollView>
                {routines.length === 0 ? (
                  <TouchableOpacity
                    style={{ padding: 12 }}
                    onPress={() => setShowRoutineDropdown(false)}
                  >
                    <Text style={{ color: '#999', textAlign: 'center' }}>
                      No routines found
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={{ padding: 8, backgroundColor: '#f0f0f0' }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        Debug: {routines.length} routines loaded
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                      onPress={() => handleRoutineSelect('')}
                    >
                      <Text style={{ color: '#999' }}>Clear Selection</Text>
                    </TouchableOpacity>
                    {routines.map((routine) => (
                      <TouchableOpacity
                        key={routine.id}
                        style={{ 
                          padding: 12, 
                          borderBottomWidth: 1, 
                          borderBottomColor: '#eee',
                          backgroundColor: selectedRoutine === routine.id ? '#e3f2fd' : '#fff'
                        }}
                        onPress={() => handleRoutineSelect(routine.id)}
                      >
                        <Text style={{ fontSize: 16 }}>{routine.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </View>
        
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
          <View style={{ 
            marginTop: 30,
            backgroundColor: routineLoaded ? '#f0f9ff' : 'transparent',
            borderRadius: 12,
            padding: routineLoaded ? 16 : 0,
            borderWidth: routineLoaded ? 2 : 0,
            borderColor: routineLoaded ? '#3b82f6' : 'transparent',
          }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              marginBottom: 15,
              color: routineLoaded ? '#1e40af' : '#000',
            }}>
              {routineLoaded ? '🎯 Routine Workout Session' : 'Your Workout Session'}
            </Text>
            {routineLoaded && (
              <Text style={{ 
                fontSize: 14, 
                color: '#1e40af', 
                marginBottom: 15,
                textAlign: 'center',
                fontWeight: '500',
              }}>
                Template loaded — add your actual sets below
              </Text>
            )}
            
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
                        <Text style={{ fontSize: 14, fontWeight: '500', minWidth: 50 }}>
                          Set {index + 1}
                        </Text>
                        <View style={{ flexDirection: 'row', flex: 1, marginHorizontal: 10 }}>
                          <TextInput
                            style={{
                              flex: 1,
                              height: 36,
                              borderColor: '#ddd',
                              borderWidth: 1,
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              textAlign: 'center',
                              marginRight: 8,
                              fontSize: 14,
                            }}
                            placeholder="Reps"
                            keyboardType="numeric"
                            value={set.reps}
                            onChangeText={(value) => updateSetValues(exercise.exercise_id, index, 'reps', value)}
                          />
                          <TextInput
                            style={{
                              flex: 1,
                              height: 36,
                              borderColor: '#ddd',
                              borderWidth: 1,
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              textAlign: 'center',
                              fontSize: 14,
                            }}
                            placeholder="Weight"
                            keyboardType="numeric"
                            value={set.weight}
                            onChangeText={(value) => updateSetValues(exercise.exercise_id, index, 'weight', value)}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => removeSetFromExercise(exercise.exercise_id, index)}
                          style={{ backgroundColor: '#dc3545', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                        >
                          <Text style={{ color: 'white', fontSize: 12 }}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add New Set */}
                    <View style={{ marginTop: 15 }}>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#007AFF',
                          paddingVertical: 10,
                          borderRadius: 6,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: '#0056b3',
                        }}
                        onPress={() => addSetToExercise(exercise.exercise_id)}
                      >
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                          + Add Set
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
                backgroundColor: routineLoaded ? '#3b82f6' : '#28a745',
                paddingVertical: 15,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 20,
                borderWidth: routineLoaded ? 2 : 0,
                borderColor: routineLoaded ? '#1e40af' : 'transparent',
              }}
              onPress={saveWorkoutSession}
              disabled={saving}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                {saving 
                  ? 'Saving Session...' 
                  : routineLoaded 
                    ? '💪 Save Routine Workout' 
                    : 'Save Workout Session'
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}