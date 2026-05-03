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

  // Volume tracking
  const calculateExerciseVolume = (sets: ExerciseSet[]) => {
    return sets.reduce((total, set) => {
      const reps = parseFloat(set.reps) || 0;
      const weight = parseFloat(set.weight) || 0;
      return total + (reps * weight);
    }, 0);
  };

  const calculateTotalWorkoutVolume = () => {
    return sessionExercises.reduce((total, exercise) => {
      return total + calculateExerciseVolume(exercise.sets);
    }, 0);
  };

  // Rest timer functionality
  const [activeTimer, setActiveTimer] = useState<{exerciseId: string, timeLeft: number, totalTime: number} | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const getRestTime = (muscleGroup: string) => {
    // Exercise-specific rest times (more practical)
    const compoundMuscles = ['Chest', 'Back', 'Legs', 'Shoulders'];
    const isolationMuscles = ['Biceps', 'Triceps', 'Abs', 'Calves'];
    
    if (compoundMuscles.includes(muscleGroup)) {
      return 90; // 1.5 minutes for compound exercises
    } else if (isolationMuscles.includes(muscleGroup)) {
      return 60; // 1 minute for isolation exercises
    } else {
      return 75; // 1.25 minutes default
    }
  };

  const startRestTimer = (exerciseId: string, muscleGroup: string) => {
    const restTime = getRestTime(muscleGroup);
    setActiveTimer({
      exerciseId,
      timeLeft: restTime,
      totalTime: restTime
    });
    setIsPaused(false);
  };

  const stopTimer = () => {
    setActiveTimer(null);
    setIsPaused(false);
  };

  const togglePauseTimer = () => {
    setIsPaused(!isPaused);
  };

  // Timer countdown effect
  React.useEffect(() => {
    if (activeTimer && !isPaused) {
      const interval = setInterval(() => {
        setActiveTimer(prev => {
          if (!prev || prev.timeLeft <= 1) {
            return null;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeTimer, isPaused]);

  // Progressive overload functionality
  const [exerciseSuggestions, setExerciseSuggestions] = useState<{[key: string]: {weight: number, reps: number, type: string, description: string}}>({});

  const calculateProgressiveOverload = (lastPerformance: any) => {
    if (!lastPerformance) return null;

    const lastWeight = lastPerformance.weight || 0;
    const lastReps = lastPerformance.reps || 0;
    
    // Progressive overload strategies
    const suggestions = [];
    
    // 1. Weight increase (keep same reps)
    if (lastWeight >= 5) { // Only suggest weight increase if weight is meaningful
      const weightIncrease = Math.min(2.5, lastWeight * 0.05); // 5% or 2.5kg, whichever is smaller
      const roundedIncrease = Math.round(weightIncrease / 2.5) * 2.5; // Round to nearest 2.5kg
      suggestions.push({
        weight: lastWeight + roundedIncrease,
        reps: lastReps,
        type: 'weight_increase',
        description: `+${roundedIncrease}kg (same reps)`
      });
    }
    
    // 2. Rep increase (keep same weight)
    if (lastReps < 12) { // Only suggest rep increase if not already high rep range
      suggestions.push({
        weight: lastWeight,
        reps: Math.min(lastReps + 2, 12),
        type: 'rep_increase',
        description: `+${Math.min(2, 12 - lastReps)} reps (same weight)`
      });
    }
    
    // 3. Intensity boost (slight weight increase, slight rep decrease)
    if (lastWeight >= 10 && lastReps >= 6) {
      suggestions.push({
        weight: lastWeight + 2.5,
        reps: Math.max(lastReps - 1, 4),
        type: 'intensity_boost',
        description: `+2.5kg, -1 rep (intensity)`
      });
    }
    
    return suggestions.length > 0 ? suggestions[0] : null; // Return the first (best) suggestion
  };

  const fetchExerciseSuggestions = async (exerciseId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workout_entries')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const lastPerformance = data[0];
        const suggestion = calculateProgressiveOverload(lastPerformance);
        
        if (suggestion) {
          setExerciseSuggestions(prev => ({
            ...prev,
            [exerciseId]: suggestion
          }));
        }
      }
    } catch (err) {
      console.log('Error fetching exercise suggestions:', err);
    }
  };

  const applySuggestion = (exerciseId: string) => {
    const suggestion = exerciseSuggestions[exerciseId];
    if (!suggestion) return;

    // Auto-fill the next set with suggested values
    setNewSetWeight(prev => ({ ...prev, [exerciseId]: String(suggestion.weight) }));
    setNewSetReps(prev => ({ ...prev, [exerciseId]: String(suggestion.reps) }));
  };

  // Quick Set Templates
  const [showTemplateOptions, setShowTemplateOptions] = useState<string | null>(null);

  interface SetTemplate {
    name: string;
    description: string;
    sets: { reps: number, weight: number, type: string }[];
  }

  const getSetTemplates = (baseWeight: number): SetTemplate[] => {
    if (!baseWeight || baseWeight <= 0) return [];

    return [
      {
        name: 'Warm-up Sets',
        description: 'Light sets to prepare muscles',
        sets: [
          { reps: 12, weight: Math.round(baseWeight * 0.5), type: 'warmup' },
          { reps: 8, weight: Math.round(baseWeight * 0.75), type: 'warmup' },
        ]
      },
      {
        name: 'Pyramid Sets',
        description: 'Decreasing reps, increasing weight',
        sets: [
          { reps: 12, weight: Math.round(baseWeight * 0.6), type: 'pyramid' },
          { reps: 10, weight: Math.round(baseWeight * 0.8), type: 'pyramid' },
          { reps: 8, weight: baseWeight, type: 'pyramid' },
          { reps: 6, weight: Math.round(baseWeight * 1.1), type: 'pyramid' },
        ]
      },
      {
        name: 'Drop Sets',
        description: 'Same reps, decreasing weight',
        sets: [
          { reps: 8, weight: baseWeight, type: 'drop' },
          { reps: 8, weight: Math.round(baseWeight * 0.8), type: 'drop' },
          { reps: 8, weight: Math.round(baseWeight * 0.6), type: 'drop' },
        ]
      }
    ];
  };

  const applySetTemplate = (exerciseId: string, template: SetTemplate) => {
    const exercise = sessionExercises.find(ex => ex.exercise_id === exerciseId);
    if (!exercise) return;

    // Add template sets to the exercise
    const newSets = template.sets.map(set => ({
      reps: String(set.reps),
      weight: String(set.weight)
    }));

    setSessionExercises(sessionExercises.map(ex => {
      if (ex.exercise_id === exerciseId) {
        return {
          ...ex,
          sets: [...ex.sets, ...newSets]
        };
      }
      return ex;
    }));

    setShowTemplateOptions(null); // Close template options
  };

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
      
      // Fetch progressive overload suggestions for this exercise
      fetchExerciseSuggestions(exercise.id);
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
        
        // Auto-start rest timer when set is completed (both reps and weight filled)
        const currentSet = updatedSets[setIndex];
        if (currentSet.reps && currentSet.weight && !activeTimer) {
          startRestTimer(exerciseId, ex.muscle_group);
        }
        
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
                    <Text style={{
                      fontSize: 12,
                      color: theme.colors.primary,
                      fontWeight: '600',
                      marginTop: 2,
                    }}>
                      Volume: {calculateExerciseVolume(exercise.sets).toLocaleString()} kg
                    </Text>
                  </View>
                  <AppButton
                    title="Remove"
                    variant="danger"
                    onPress={() => removeExerciseFromSession(exercise.exercise_id)}
                  />
                </View>

                {/* Rest Timer */}
                {activeTimer && activeTimer.exerciseId === exercise.exercise_id && (
                  <Card style={{ 
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary,
                    borderWidth: 2
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <View>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: theme.colors.primary,
                        }}>
                          Rest Timer
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: theme.colors.subtext,
                        }}>
                          {getRestTime(exercise.muscle_group) / 60} min recommended
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{
                          fontSize: 24,
                          fontWeight: 'bold',
                          color: theme.colors.primary,
                        }}>
                          {Math.floor(activeTimer.timeLeft / 60)}:{(activeTimer.timeLeft % 60).toString().padStart(2, '0')}
                        </Text>
                        <View style={{
                          flexDirection: 'row',
                          gap: 8,
                          marginTop: 4,
                        }}>
                          <TouchableOpacity
                            onPress={togglePauseTimer}
                            style={{
                              backgroundColor: theme.colors.primary,
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{
                              color: 'white',
                              fontSize: 12,
                              fontWeight: '600',
                            }}>
                              {isPaused ? 'Resume' : 'Pause'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={stopTimer}
                            style={{
                              backgroundColor: theme.colors.danger,
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{
                              color: 'white',
                              fontSize: 12,
                              fontWeight: '600',
                            }}>
                              Skip
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    {/* Progress Bar */}
                    <View style={{
                      height: 4,
                      backgroundColor: theme.colors.border,
                      borderRadius: 2,
                      marginTop: 8,
                    }}>
                      <View style={{
                        height: '100%',
                        backgroundColor: theme.colors.primary,
                        borderRadius: 2,
                        width: `${((activeTimer.totalTime - activeTimer.timeLeft) / activeTimer.totalTime) * 100}%`,
                      }} />
                    </View>
                  </Card>
                )}

                {/* Progressive Overload Suggestion */}
                {exerciseSuggestions[exercise.exercise_id] && (
                  <Card style={{ 
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary,
                    borderWidth: 2
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: theme.colors.primary,
                          marginBottom: 4,
                        }}>
                          💪 Progressive Overload
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          color: theme.colors.text,
                          marginBottom: 2,
                        }}>
                          Suggested: {exerciseSuggestions[exercise.exercise_id].weight}kg × {exerciseSuggestions[exercise.exercise_id].reps} reps
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: theme.colors.subtext,
                          fontStyle: 'italic',
                        }}>
                          {exerciseSuggestions[exercise.exercise_id].description}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => applySuggestion(exercise.exercise_id)}
                        style={{
                          backgroundColor: theme.colors.primary,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{
                          color: 'white',
                          fontSize: 14,
                          fontWeight: '600',
                        }}>
                          Apply
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                )}

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

                  {/* Add Set and Template Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <AppButton
                        title="+ Add Set"
                        variant="secondary"
                        onPress={() => addSetToExercise(exercise.exercise_id)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppButton
                        title="📋 Templates"
                        variant="primary"
                        onPress={() => setShowTemplateOptions(exercise.exercise_id)}
                      />
                    </View>
                  </View>
                </View>
              </Card>
            ))}
            
            {/* Total Workout Volume */}
            {sessionExercises.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                  }}>
                    Total Workout Volume
                  </Text>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: theme.colors.primary,
                  }}>
                    {calculateTotalWorkoutVolume().toLocaleString()} kg
                  </Text>
                </View>
                <Text style={{
                  fontSize: 12,
                  color: theme.colors.subtext,
                  marginTop: 4,
                }}>
                  {sessionExercises.length} exercises • {sessionExercises.reduce((total, ex) => total + ex.sets.length, 0)} sets
                </Text>
              </Card>
            )}
            
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

    {/* Template Selection Modal */}
    {showTemplateOptions && (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: 400,
          padding: 20 
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 16,
            textAlign: 'center',
          }}>
            📋 Choose Set Template
          </Text>
          
          {(() => {
            const exercise = sessionExercises.find(ex => ex.exercise_id === showTemplateOptions);
            const lastSet = exercise?.sets[exercise.sets.length - 1];
            const baseWeight = lastSet ? parseFloat(lastSet.weight) || 0 : 0;
            const templates = getSetTemplates(baseWeight);
            
            return templates.length > 0 ? (
              templates.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => applySetTemplate(showTemplateOptions, template)}
                  style={{
                    backgroundColor: theme.colors.card,
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 2,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    marginBottom: 4,
                  }}>
                    {template.name}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: theme.colors.subtext,
                    marginBottom: 8,
                  }}>
                    {template.description}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {template.sets.map((set, setIndex) => (
                      <Text key={setIndex} style={{
                        fontSize: 12,
                        color: theme.colors.primary,
                        backgroundColor: theme.colors.primary + '20',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}>
                        {set.reps}×{set.weight}kg
                      </Text>
                    ))}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{
                fontSize: 14,
                color: theme.colors.subtext,
                textAlign: 'center',
                marginBottom: 16,
              }}>
                Add a set first to use templates
              </Text>
            );
          })()}
          
          <AppButton
            title="Cancel"
            variant="secondary"
            onPress={() => setShowTemplateOptions(null)}
          />
        </Card>
      </View>
    )}
  </SafeAreaView>
);
}