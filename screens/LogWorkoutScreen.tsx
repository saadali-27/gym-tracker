import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform, StyleSheet, Animated, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCurrentUser } from '../services/supabase';
import { theme } from '../theme';
import { AppHeader, RowItem, SectionLabel, StatBox, PrimaryButton, GhostButton, StandardHeader } from '../components';
import Input from '../components/Input';
import Card from '../components/Card';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 0,
    paddingBottom: 140,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  // Premium Custom Dropdown Styles
  selectorContainer: {
    marginBottom: theme.spacing.md,
  },
  selectorTrigger: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorTriggerText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  selectorTriggerPlaceholder: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.subtext,
    flex: 1,
  },
  selectorChevron: {
    fontSize: 16,
    color: theme.colors.subtext,
    transform: [{ rotate: '0deg' }],
  },
  selectorChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  selectorTriggerPressed: {
    backgroundColor: theme.colors.surface + '80',
  },
  selectorRightElement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.danger,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownMenu: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 240,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  dropdownOptionSelected: {
    backgroundColor: theme.colors.primary + '15',
  },
  dropdownOptionSelectedText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dropdownOptionChevron: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: theme.colors.border + '30',
  },
  routineLoadedBanner: {
    backgroundColor: theme.colors.primary + '08',
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  routineLoadedText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  searchInputContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  searchInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  loadingText: {
    color: '#ffffff', // Force white for visibility
    textAlign: 'center',
  },
  exerciseListContainer: {
    marginBottom: theme.spacing.xl,
  },
  addIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background,
  },
  sessionContainer: {
    marginTop: theme.spacing.xl,
  },
  exerciseCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff', // Force white for visibility
    marginBottom: theme.spacing.xs,
  },
  exerciseSubtitle: {
    fontSize: 14,
    color: '#ffffff', // Force white for visibility
  },
  setsContainer: {
    gap: theme.spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  setNumber: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  setInputContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
  },
  setInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
  removeSetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSetText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  setButtonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  totalVolumeContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  totalVolumeLabel: {
    fontSize: 14,
    color: '#ffffff', // Force white for visibility
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  totalVolumeValue: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff', // Force white for visibility
    marginBottom: theme.spacing.md,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#ffffff', // Force white for visibility
    marginBottom: theme.spacing.lg,
  },
  templateContainer: {
    gap: theme.spacing.sm,
  },
  templateItem: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff', // Force white for visibility
    marginBottom: theme.spacing.xs,
  },
  templateDetails: {
    fontSize: 12,
    color: '#ffffff', // Force white for visibility
  },
  });

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
  const [activeTimer, setActiveTimer] = useState<{exerciseId: string, timeLeft: number} | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  // Premium dropdown animations
  const [dropdownScale] = useState(new Animated.Value(0.95));
  const [dropdownOpacity] = useState(new Animated.Value(0));
  
  const openDropdown = () => {
    Animated.parallel([
      Animated.spring(dropdownScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(dropdownScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    fetchExercises();
    fetchRoutines();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchExercises();
      fetchRoutines();
    }, [])
  );

  // Save exercises to AsyncStorage when they change
  useEffect(() => {
    const saveExercises = async () => {
      try {
        await AsyncStorage.setItem('workout_exercises', JSON.stringify(sessionExercises));
      } catch (error) {
        console.error('Error saving exercises:', error);
      }
    };

    if (sessionExercises.length > 0) {
      saveExercises();
    }
  }, [sessionExercises]);

  // Load exercises from AsyncStorage on mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const savedExercises = await AsyncStorage.getItem('workout_exercises');
        if (savedExercises) {
          const parsedExercises = JSON.parse(savedExercises);
          setSessionExercises(parsedExercises || []);
        }
      } catch (error) {
        console.error('Error loading exercises:', error);
      }
    };

    loadExercises();
  }, []);

  // Rest Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeTimer && !isPaused) {
      interval = setInterval(() => {
        setActiveTimer(prev => {
          if (!prev) return null;
          
          const newTimeLeft = prev.timeLeft - 1000;
          
          if (newTimeLeft <= 0) {
            // Timer finished
            return null;
          }
          
          return {
            ...prev,
            timeLeft: newTimeLeft
          };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTimer, isPaused]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const { data: exercisesData, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(exercisesData || []);
      setFilteredExercises(exercisesData || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutines = async () => {
    try {
      const authUser = await getCurrentUser();
      if (!authUser) return;

      const { data: routinesData, error } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', authUser.id)
        .order('name');

      if (error) throw error;
      setRoutines(routinesData || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  };

  const handleRoutineSelect = async (routineId: string) => {
    setSelectedRoutine(routineId);
    closeDropdown();
    setTimeout(() => setShowRoutineDropdown(false), 150);

    if (routineId) {
      try {
        const authUser = await getCurrentUser();
        if (!authUser) return;

        const { data: routineExercises, error } = await supabase
          .from('routine_exercises')
          .select('*, exercises(*)')
          .eq('routine_id', routineId)
          .eq('user_id', authUser.id);

        if (error) throw error;

        const formattedExercises: SessionExercise[] = (routineExercises || []).map((re: any) => ({
          exercise_id: re.exercise_id,
          name: re.exercises.name,
          muscle_group: re.exercises.muscle_group,
          sets: []
        }));

        setSessionExercises(formattedExercises);
        setRoutineLoaded(true);
      } catch (error) {
        console.error('Error loading routine:', error);
        Alert.alert('Error', 'Failed to load routine');
      }
    } else {
      setSessionExercises([]);
      setRoutineLoaded(false);
    }
  };

  const clearRoutine = () => {
    setSelectedRoutine('');
    setSessionExercises([]);
    setRoutineLoaded(false);
  };

  const addExerciseToSession = (exercise: any) => {
    const exists = sessionExercises.some(ex => ex.exercise_id === exercise.id);
    if (!exists) {
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
  };

  const addSetToExercise = (exerciseId: string) => {
    setSessionExercises(sessionExercises.map(ex => 
      ex.exercise_id === exerciseId 
        ? { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] }
        : ex
    ));
  };

  const removeSetFromExercise = (exerciseId: string, setIndex: number) => {
    setSessionExercises(sessionExercises.map(ex => 
      ex.exercise_id === exerciseId 
        ? { ...ex, sets: ex.sets.filter((_, index) => index !== setIndex) }
        : ex
    ));
  };

  const updateSetValues = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: string) => {
    setSessionExercises(sessionExercises.map(ex => 
      ex.exercise_id === exerciseId 
        ? { 
            ...ex, 
            sets: ex.sets.map((set, index) => 
              index === setIndex ? { ...set, [field]: value } : set
            )
          }
        : ex
    ));
  };

  const calculateExerciseVolume = (sets: ExerciseSet[]) => {
    return sets.reduce((total, set) => {
      const reps = parseInt(set.reps) || 0;
      const weight = parseFloat(set.weight) || 0;
      return total + (reps * weight);
    }, 0);
  };

  const calculateTotalWorkoutVolume = () => {
    return sessionExercises.reduce((total, exercise) => {
      return total + calculateExerciseVolume(exercise.sets);
    }, 0);
  };

  const startRestTimer = (exerciseId: string, duration: number = 60000) => {
    setActiveTimer({
      exerciseId,
      timeLeft: duration
    });
    setIsPaused(false);
  };

  const validateSession = () => {
    if (sessionExercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise to your workout');
      return false;
    }

    for (const exercise of sessionExercises) {
      if (exercise.sets.length === 0) {
        Alert.alert('No Sets', `Please add at least one set to ${exercise.name}`);
        return false;
      }

      for (const set of exercise.sets) {
        if (!set.reps || !set.weight) {
          Alert.alert('Incomplete Set', `Please complete all reps and weight values for ${exercise.name}`);
          return false;
        }
      }
    }

    return true;
  };

  const saveWorkoutSession = async () => {
    if (!validateSession()) return;

    setSaving(true);

    try {
      const now = new Date();
      const authUser = await getCurrentUser();
      if (!authUser) return;

      // Save with proper timestamp storage and simple date string
      const currentTime = new Date();
      const timestamp = BigInt(currentTime.getTime()); // Store as BIGINT for database
      const simpleDateString = `${currentTime.getMonth() + 1}/${currentTime.getDate()}/${currentTime.getFullYear()}`; // Simple MM/DD/YYYY format without time
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: authUser.id,
          date: simpleDateString, // Store simple date string without time
          timestamp: timestamp, // Store timestamp for app logic
          routine_id: selectedRoutine || null,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const workoutEntries: WorkoutEntry[] = [];
      for (const exercise of sessionExercises) {
        for (const set of exercise.sets) {
          workoutEntries.push({
            workout_id: workout.id,
            exercise_id: exercise.exercise_id,
            sets: 1,
            reps: parseInt(set.reps),
            weight: parseFloat(set.weight),
          });
        }
      }

      const { error: entriesError } = await supabase
        .from('workout_entries')
        .insert(workoutEntries);

      if (entriesError) throw entriesError;

      Alert.alert('Success', 'Workout saved successfully!');
      setSessionExercises([]);
      setSearchQuery('');
      setSelectedRoutine('');
      setRoutineLoaded(false);

    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Save Failed', 'Failed to save your workout. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const filtered = exercises.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [searchQuery, exercises]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
          >
            <StandardHeader title="Log Workout" />

            {/* Routine Selection - Premium Custom Dropdown */}
            <View style={styles.section}>
              <SectionLabel label="Routine (optional)" />
              
              {/* Custom Selector Trigger */}
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[
                    styles.selectorTrigger,
                    showRoutineDropdown && styles.selectorTriggerPressed
                  ]}
                  onPress={() => {
                    if (!showRoutineDropdown) {
                      setShowRoutineDropdown(true);
                      openDropdown();
                    } else {
                      closeDropdown();
                      setTimeout(() => setShowRoutineDropdown(false), 150);
                    }
                  }}
                >
                  <Text style={[
                    selectedRoutine 
                      ? styles.selectorTriggerText 
                      : styles.selectorTriggerPlaceholder
                  ]}>
                    {selectedRoutine 
                      ? routines.find(r => r.id === selectedRoutine)?.name || 'Select routine'
                      : 'Select routine'
                    }
                  </Text>
                  
                  <View style={styles.selectorRightElement}>
                    {routineLoaded ? (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          clearRoutine();
                        }}
                      >
                        <Text style={styles.clearButtonText}>✕</Text>
                      </TouchableOpacity>
                    ) : (
                      <Animated.Text style={[
                        styles.selectorChevron,
                        showRoutineDropdown && styles.selectorChevronOpen
                      ]}>
                        ▼
                      </Animated.Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Premium Dropdown Menu */}
              {showRoutineDropdown && (
                <>
                  {/* Overlay to close dropdown when clicking outside */}
                  <TouchableOpacity 
                    style={styles.dropdownOverlay}
                    onPress={() => {
                    closeDropdown();
                    setTimeout(() => setShowRoutineDropdown(false), 150);
                  }}
                    activeOpacity={1}
                  />
                  
                  {/* Dropdown Menu */}
                  <Animated.View 
                    style={[
                      styles.dropdownMenu,
                      {
                        top: 80, // Position below the selector trigger
                        opacity: dropdownOpacity,
                        transform: [
                          {
                            scale: dropdownScale
                          },
                          {
                            translateY: dropdownOpacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 0],
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <ScrollView 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 0 }}
                    >
                      {routines.length === 0 ? (
                        <View style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>
                            No routines found
                          </Text>
                        </View>
                      ) : (
                        <>
                          {/* Clear Selection Option */}
                          <TouchableOpacity
                            style={styles.dropdownOption}
                            onPress={() => handleRoutineSelect('')}
                          >
                            <Text style={styles.dropdownOptionText}>
                              Clear Selection
                            </Text>
                          </TouchableOpacity>
                          
                          {/* Divider */}
                          <View style={styles.dropdownDivider} />
                          
                          {/* Routine Options */}
                          {routines.map((routine, index) => (
                            <TouchableOpacity
                              key={routine.id}
                              style={[
                                styles.dropdownOption,
                                selectedRoutine === routine.id && styles.dropdownOptionSelected
                              ]}
                              onPress={() => handleRoutineSelect(routine.id)}
                            >
                              <Text style={[
                                styles.dropdownOptionText,
                                selectedRoutine === routine.id && styles.dropdownOptionSelectedText
                              ]}>
                                {routine.name}
                              </Text>
                              
                              {selectedRoutine === routine.id && (
                                <Text style={styles.dropdownOptionChevron}>✓</Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                    </ScrollView>
                  </Animated.View>
                </>
              )}
            </View>

            {routineLoaded && (
              <View style={styles.routineLoadedBanner}>
                <Text style={styles.routineLoadedText}>
                  Routine loaded — log your sets below
                </Text>
              </View>
            )}

            {/* Search Input */}
            <View style={styles.section}>
              <SectionLabel label="Search exercises" />
              <View style={styles.searchInputContainer}>
                <Input
                  style={styles.searchInput}
                  placeholder="Search exercises"
                  placeholderTextColor={theme.colors.subtext}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Exercise List */}
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : filteredExercises.length === 0 ? (
              <Text style={styles.loadingText}>No exercises found</Text>
            ) : (
              <View style={styles.exerciseListContainer}>
                <SectionLabel label="Available exercises" />
                {filteredExercises.map((ex, index) => (
                  <RowItem
                    key={ex.id}
                    title={ex.name}
                    subtitle={ex.muscle_group || 'No muscle group'}
                    onPress={() => addExerciseToSession(ex)}
                    rightElement={
                      <View style={styles.addIcon}>
                        <Text style={styles.addIconText}>
                          +
                        </Text>
                      </View>
                    }
                    showDivider={index < filteredExercises.length - 1}
                  />
                ))}
              </View>
            )}

            {/* Session Exercises */}
            {sessionExercises.length > 0 && (
              <View style={{ marginTop: theme.spacing.xl }}>
                <AppHeader 
                  title="Workout exercises" 
                  subtitle={`${sessionExercises.length} exercise${sessionExercises.length > 1 ? 's' : ''} • ${sessionExercises.reduce((total, ex) => total + ex.sets.length, 0)} set${sessionExercises.reduce((total, ex) => total + ex.sets.length, 0) > 1 ? 's' : ''}`}
                />

                {sessionExercises.map((exercise) => (
                  <Card key={exercise.exercise_id} style={{ 
                    marginBottom: theme.spacing.lg,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 8,
                    padding: theme.spacing.lg,
                  }}>
                    {/* Exercise Header */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: theme.spacing.md,
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 18,
                          fontWeight: '600',
                          color: '#ffffff',
                          marginBottom: theme.spacing.xs,
                        }}>
                          {exercise.name}
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          color: '#ffffff',
                        }}>
                          {exercise.muscle_group} • {calculateExerciseVolume(exercise.sets).toLocaleString()} kg
                        </Text>
                      </View>
                      <GhostButton
                        title="Remove"
                        onPress={() => removeExerciseFromSession(exercise.exercise_id)}
                      />
                    </View>

                    {/* Sets Section */}
                    <View style={{ gap: theme.spacing.xs }}>
                      {exercise.sets.map((set, index) => (
                        <View key={index} style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing.xs,
                        }}>
                          {/* Set Number */}
                          <View style={{
                            backgroundColor: theme.colors.surface,
                            paddingHorizontal: theme.spacing.sm,
                            paddingVertical: theme.spacing.sm,
                            borderRadius: 20,
                            minWidth: 40,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                          }}>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: theme.colors.text,
                            }}>
                              {index + 1}
                            </Text>
                          </View>

                          {/* Reps Input */}
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: theme.colors.surface,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                              paddingHorizontal: theme.spacing.sm,
                              paddingVertical: theme.spacing.sm,
                              justifyContent: 'center',
                            }}
                            onPress={() => {
                              // Focus the input when container is pressed
                            }}
                          >
                            <Input
                              style={{
                                backgroundColor: 'transparent',
                                borderWidth: 0,
                                padding: 0,
                                margin: 0,
                                width: '100%',
                              }}
                              textAlign="center"
                              placeholder="Reps"
                              placeholderTextColor={theme.colors.subtext}
                              keyboardType="numeric"
                              value={set.reps}
                              onChangeText={(value) => updateSetValues(exercise.exercise_id, index, 'reps', value)}
                              color={theme.colors.text}
                              caretHidden={false}
                            />
                          </TouchableOpacity>

                          {/* Weight Input */}
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: theme.colors.surface,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                              paddingHorizontal: theme.spacing.sm,
                              paddingVertical: theme.spacing.sm,
                              justifyContent: 'center',
                            }}
                            onPress={() => {
                              // Focus the input when container is pressed
                            }}
                          >
                            <Input
                              style={{
                                backgroundColor: 'transparent',
                                borderWidth: 0,
                                padding: 0,
                                margin: 0,
                                width: '100%',
                              }}
                              textAlign="center"
                              placeholder="Weight"
                              placeholderTextColor={theme.colors.subtext}
                              keyboardType="numeric"
                              value={set.weight}
                              onChangeText={(value) => updateSetValues(exercise.exercise_id, index, 'weight', value)}
                              color={theme.colors.text}
                              caretHidden={false}
                            />
                          </TouchableOpacity>

                          {/* Action Button */}
                          <TouchableOpacity
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: set.reps && set.weight ? theme.colors.primary : theme.colors.surface,
                              borderWidth: 1,
                              borderColor: set.reps && set.weight ? theme.colors.primary : theme.colors.border,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                            onPress={() => {
                              if (set.reps && set.weight) {
                                // Save logic here - for now just keep the set
                                console.log('Set saved:', { reps: set.reps, weight: set.weight });
                              } else {
                                removeSetFromExercise(exercise.exercise_id, index);
                              }
                            }}
                          >
                            <Text style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: set.reps && set.weight ? 'white' : theme.colors.subtext,
                            }}>
                              {set.reps && set.weight ? '✓' : '×'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}

                      {/* Action Buttons */}
                      <View style={{ 
                        flexDirection: 'row', 
                        gap: theme.spacing.sm, 
                        marginTop: theme.spacing.md,
                        paddingHorizontal: theme.spacing.xs,
                      }}>
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: theme.colors.surface,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: 12,
                            paddingVertical: theme.spacing.sm,
                            paddingHorizontal: theme.spacing.md,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => addSetToExercise(exercise.exercise_id)}
                        >
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: theme.colors.primary,
                          }}>
                            + Add Set
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: theme.colors.primary + '10',
                            borderWidth: 1,
                            borderColor: theme.colors.primary,
                            borderRadius: 12,
                            paddingVertical: theme.spacing.sm,
                            paddingHorizontal: theme.spacing.md,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => startRestTimer(exercise.exercise_id)}
                        >
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: theme.colors.primary,
                          }}>
                            ⏱ Start Rest
                          </Text>
                        </TouchableOpacity>
                      </View>
                      </View>
                  </Card>
                ))}

                {/* Total Volume */}
                <View style={{
                  marginBottom: theme.spacing.lg,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: '#ffffff',
                    marginBottom: theme.spacing.xs,
                    fontWeight: '500',
                  }}>
                    Total volume
                  </Text>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '600',
                    color: theme.colors.primary,
                  }}>
                    {calculateTotalWorkoutVolume().toLocaleString()} kg
                  </Text>
                </View>

                {/* Rest Timer */}
                {activeTimer && (
                  <View style={{
                    marginBottom: theme.spacing.lg,
                    alignItems: 'center',
                  }}>
                    <View style={{
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: 12,
                      padding: theme.spacing.lg,
                      alignItems: 'center',
                      minWidth: 200,
                    }}>
                      <Text style={{
                        fontSize: 14,
                        color: theme.colors.subtext,
                        marginBottom: theme.spacing.sm,
                        fontWeight: '500',
                      }}>
                        Rest Timer
                      </Text>
                      <Text style={{
                        fontSize: 32,
                        fontWeight: '700',
                        color: theme.colors.primary,
                        marginBottom: theme.spacing.md,
                      }}>
                        {Math.ceil(activeTimer.timeLeft / 1000)}s
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        gap: theme.spacing.sm,
                      }}>
                        <GhostButton
                          title={isPaused ? "Resume" : "Pause"}
                          onPress={() => setIsPaused(!isPaused)}
                        />
                        <GhostButton
                          title="Stop"
                          onPress={() => setActiveTimer(null)}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Save Session Button */}
                <PrimaryButton
                  title={saving 
                    ? 'Saving session...' 
                    : routineLoaded 
                      ? 'Save routine workout' 
                      : 'Save session'
                  }
                  onPress={saveWorkoutSession}
                  loading={saving}
                />
              </View>
            )}

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
