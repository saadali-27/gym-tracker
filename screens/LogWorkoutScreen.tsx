import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform, StyleSheet, Animated, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { supabase, getCurrentUser } from '../services/supabase';
import { theme } from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import AppButton from '../components/AppButton';

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
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const openDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const dropdownStyle = {
    opacity: dropdownAnim,
    transform: [
      {
        translateY: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-5, 0],
        }),
      },
    ],
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchExercises();
      fetchRoutines();
    }, [])
  );

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*');
      if (error) {
        console.error('Error fetching exercises:', error);
        Alert.alert('Error', 'Failed to load exercises. Please check your connection.');
      } else {
        setExercises(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching exercises:', error);
      Alert.alert('Error', 'Failed to load exercises. Please try again.');
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
        Alert.alert('Error', 'Failed to load routines. Please check your connection.');
      } else {
        console.log('✅ ROUTINES FETCHED:', data);
        console.log('✅ ROUTINES COUNT:', data?.length || 0);
        setRoutines(data || []);
      }
    } catch (error) {
      console.error('❌ ERROR:', error);
      Alert.alert('Error', 'Failed to load routines. Please try again.');
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
    // Validate input before updating
    const validatedValue = validateSetInput(value, field);
    
    setSessionExercises(sessionExercises.map(ex => {
      if (ex.exercise_id === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          [field]: validatedValue
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
    
    // Check if any exercise has at least one valid set (with reps > 0 and weight > 0)
    const hasValidSets = sessionExercises.some(exercise => 
      exercise.sets.some(set => {
        const reps = parseInt(set.reps);
        const weight = parseFloat(set.weight);
        
        // Validate that reps and weight are valid numbers
        if (isNaN(reps) || isNaN(weight)) {
          return false;
        }
        
        // Validate ranges: reps should be 1-100, weight should be 0.5-1000kg
        return reps > 0 && reps <= 100 && weight > 0 && weight <= 1000;
      })
    );
    
    if (!hasValidSets) {
      Alert.alert('Invalid Input', 'Please add at least one complete set with valid reps (1-100) and weight (0.5-1000kg)');
      return false;
    }
    
    return true;
  };

  const validateSetInput = (value: string, type: 'reps' | 'weight') => {
    const num = parseFloat(value);
    
    if (value === '' || isNaN(num)) {
      return '';
    }
    
    if (type === 'reps') {
      // Reps should be between 1 and 100
      return num > 0 && num <= 100 ? value : Math.max(1, Math.min(100, num)).toString();
    } else {
      // Weight should be between 0.5 and 1000kg
      return num > 0 && num <= 1000 ? value : Math.max(0.5, Math.min(1000, num)).toString();
    }
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
    
    const authUser = await getCurrentUser();
    
    const { data: newWorkout, error: createError } = await supabase
      .from('workouts')
      .insert({
        date: localDateString,
        routine_id: selectedRoutine || null,
        user_id: authUser?.id
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

    const currentUser = await getCurrentUser();

    const updatedEntries = workoutEntries.map((entry) => ({
      ...entry,
      user_id: currentUser?.id,
    }));

    const { error: entryError } = await supabase
      .from('workout_entries')
      .insert(updatedEntries);

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
    Alert.alert('Save Failed', 'Failed to save your workout. Please check your connection and try again.');
  } finally {
    setSaving(false);
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 140
            }}
          >
        <View style={{ 
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
          marginBottom: 6,
        }}>
          <Text style={{ 
            fontSize: 22, 
            fontWeight: '600', 
            color: '#E6EAF2',
            textAlign: 'center',
          }}>
            Log Workout
          </Text>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.08)',
            marginTop: 8,
            marginBottom: 12,
          }}
        />

        {/* Routine Selection */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  Select Routine (Optional)
                </Text>
              </View>
              {routineLoaded && (
                <AppButton
                  title="Clear Routine"
                  variant="danger"
                  onPress={clearRoutine}
                />
              )}
            </View>
            <View style={{
              backgroundColor: theme.colors.cardSoft,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 16,
            }}>
              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                  minHeight: 44,
                }}
                onPress={() => {
                  if (!showRoutineDropdown) {
                    setShowRoutineDropdown(true);
                    openDropdown();
                  } else {
                    closeDropdown();
                    setTimeout(() => setShowRoutineDropdown(false), 120);
                  }
                }}
              >
                <Text style={{ fontSize: 16, color: theme.colors.text }}>
                  {selectedRoutine 
                    ? routines.find(r => r.id === selectedRoutine)?.name || 'Select Routine'
                    : 'Select Routine'
                  }
                </Text>
              </TouchableOpacity>
            </View>
            {showRoutineDropdown && (
              <Animated.View style={[
                dropdownStyle,
                {
                  position: 'absolute',
                  top: 70,
                  left: 20,
                  right: 20,
                  backgroundColor: theme.colors.card,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  maxHeight: 200,
                  zIndex: 1000,
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }
              ]}>
                <ScrollView>
                  {routines.length === 0 ? (
                    <TouchableOpacity
                      style={{ padding: 12 }}
                      onPress={() => setShowRoutineDropdown(false)}
                    >
                      <Text style={{ color: theme.colors.subtext, textAlign: 'center' }}>
                        No routines found
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
                        onPress={() => handleRoutineSelect('')}
                      >
                        <Text style={{ color: theme.colors.subtext }}>Clear Selection</Text>
                      </TouchableOpacity>
                      {routines.map((routine) => (
                        <TouchableOpacity
                          key={routine.id}
                          style={{ 
                            padding: 12, 
                            borderBottomWidth: 1, 
                            borderBottomColor: theme.colors.border,
                            backgroundColor: selectedRoutine === routine.id ? theme.colors.primary + '20' : theme.colors.card
                          }}
                          onPress={() => handleRoutineSelect(routine.id)}
                        >
                          <Text style={{ fontSize: 16, color: theme.colors.text }}>{routine.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </ScrollView>
              </Animated.View>
            )}
          </View>
          {routineLoaded && (
            <View style={{
              backgroundColor: theme.colors.primary + '10',
              borderColor: theme.colors.primary,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}>
              <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
                💪 Routine loaded — log your sets below
              </Text>
            </View>
          )}
          
          <View>
            <Input
            style={{
              marginBottom: 20,
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
            placeholder="Search exercises..."
            placeholderTextColor={theme.colors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {loading ? (
            <Text style={{ color: theme.colors.text }}>Loading...</Text>
          ) : filteredExercises.length === 0 ? (
            <Text style={{ color: theme.colors.text }}>No exercises found</Text>
          ) : (
            filteredExercises.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                onPress={() => addExerciseToSession(ex)}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  marginBottom: 12,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  minHeight: 64,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600',
                  color: theme.colors.text,
                  marginBottom: 4 
                }}>
                  {ex.name}
                </Text>
                <Text style={{ 
                  fontSize: 13, 
                  color: '#9AA4B2' 
                }}>
                  {ex.muscle_group || 'No muscle group'}
                </Text>
                {sessionExercises.some(se => se.exercise_id === ex.id) && (
                  <Text style={{ 
                    fontSize: 12, 
                    color: theme.colors.primary, 
                    marginTop: 5,
                    fontWeight: '500'
                  }}>
                    ✓ Added to session
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Session Exercises Section */}
        {sessionExercises.length > 0 && (
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            {routineLoaded && (
              <Card style={{ marginBottom: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  color: theme.colors.text, 
                  textAlign: 'center',
                  fontWeight: '600',
                }}>
                  💪 Routine loaded log your sets below
                </Text>
              </Card>
            )}
            
            {sessionExercises.map((exercise) => (
              <Card key={exercise.exercise_id} style={{ marginBottom: 16 }}>
                {/* Exercise Header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: theme.colors.text,
                      marginBottom: 4,
                    }}>
                      {exercise.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: theme.colors.subtext,
                    }}>
                      {exercise.muscle_group} • {exercise.sets.length} sets
                    </Text>
                  </View>
                  <AppButton
                    title="Remove"
                    variant="danger"
                    onPress={() => removeExerciseFromSession(exercise.exercise_id)}
                  />
                </View>

                {/* Sets Section */}
                <View style={{ gap: 8 }}>
                  {exercise.sets.map((set, index) => (
                    <View key={index} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      {/* Set Number */}
                      <View style={{
                        backgroundColor: theme.colors.border,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        minWidth: 60,
                        alignItems: 'center',
                      }}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: theme.colors.text,
                        }}>
                          Set {index + 1}
                        </Text>
                      </View>

                      {/* Reps Input */}
                      <Input
                        style={{
                          flex: 1,
                        }}
                        placeholder="Reps"
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={(value) => updateSetValues(exercise.exercise_id, index, 'reps', value)}
                        textAlign="center"
                      />

                      {/* Weight Input */}
                      <Input
                        style={{
                          flex: 1,
                        }}
                        placeholder="Weight"
                        keyboardType="numeric"
                        value={set.weight}
                        onChangeText={(value) => updateSetValues(exercise.exercise_id, index, 'weight', value)}
                        textAlign="center"
                      />

                      {/* Remove Set Button */}
                      <AppButton
                        title="×"
                        variant="danger"
                        onPress={() => removeSetFromExercise(exercise.exercise_id, index)}
                      />
                    </View>
                  ))}

                  {/* Add Set Button */}
                  <AppButton
                    title="+ Add Set"
                    variant="secondary"
                    onPress={() => addSetToExercise(exercise.exercise_id)}
                  />
                </View>
              </Card>
            ))}
            
            {/* Save Session Button */}
            <AppButton
              title={saving 
                ? 'Saving Session...' 
                : routineLoaded 
                  ? 'Save Routine Workout' 
                  : 'Save Workout Session'
              }
              variant="primary"
              onPress={saveWorkoutSession}
              disabled={saving}
            />
          </View>
        )}
      </ScrollView>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}