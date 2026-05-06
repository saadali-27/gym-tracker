import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase, getCurrentUser } from '../services/supabase';
import { theme } from '../theme';
import { AppHeader, RowItem, SectionLabel, StatBox, PrimaryButton, GhostButton, StandardHeader } from '../components';
import Input from '../components/Input';

interface Routine {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  exercises?: Exercise[];
}

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  routineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  routineDate: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  exerciseName: {
    color: theme.colors.text,
    fontSize: 15,
  },
  savedExercisesContainer: {
    marginTop: theme.spacing.md,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  savedExercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  selectedExercisesContainer: {
    marginTop: theme.spacing.md,
  },
  selectedExercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  routineSeparator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  exerciseItemTouchable: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseItemContent: {
    flex: 1,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  exerciseItemSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  selectedIndicator: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  exerciseListContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: 140,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    // Remove flex: 1 to let button handle its own styling
  },
  saveButton: {
    // Remove flex: 1 to let button handle its own styling
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  doneButton: {
    // Remove flex: 1 to let button handle its own styling
  },
  inputSection: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
    card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
});

// Standardized date parsing function - use everywhere
const parseWorkoutDate = (dateValue: any) => {
  if (!dateValue) return null;
  
  // Create date object from stored value without modifying it
  const date = new Date(dateValue);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return null;
  
  return date;
};

// Standardized date comparison function
const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Import working date logic
const getCurrentDayLabel = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1; // Convert to Monday=0, Sunday=6
  return days[adjustedToday];
};

export default function RoutinesScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Remove time - show only day, date, year
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  const [newRoutineName, setNewRoutineName] = useState('');
  const [creatingRoutine, setCreatingRoutine] = useState(false);
  
  // Exercise selection state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<{[key: string]: Exercise[]}>({});
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('');
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Force date update every minute to ensure correct date display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Update current date when screen focuses
      setCurrentDate(new Date());
      fetchRoutines();
      fetchExercises();
    }, [])
  );

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises (
            exercises (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include exercises in the expected format
      const routinesWithExercises = (data || []).map(routine => ({
        ...routine,
        exercises: routine.routine_exercises?.map((re: any) => re.exercises).filter(Boolean) || []
      }));
      
      setRoutines(routinesWithExercises);
    } catch (error) {
      console.error('Error fetching routines:', error);
      Alert.alert('Error', 'Failed to fetch routines');
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const createRoutine = async () => {
    if (!newRoutineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    try {
      setCreatingRoutine(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('routines')
        .insert([{
          name: newRoutineName.trim(),
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setRoutines([data, ...routines]);
      setNewRoutineName('');
      setShowCreateModal(false);
      Alert.alert('Success', 'Routine created successfully');
    } catch (error) {
      console.error('Error creating routine:', error);
      Alert.alert('Error', 'Failed to create routine');
    } finally {
      setCreatingRoutine(false);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('routines')
                .delete()
                .eq('id', routineId);

              if (error) throw error;
              
              setRoutines(routines.filter(r => r.id !== routineId));
              Alert.alert('Success', 'Routine deleted successfully');
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          }
        }
      ]
    );
  };

  const openExerciseSelection = (routineId: string) => {
    setSelectedRoutineId(routineId);
    // Initialize with empty array for new selection, not existing exercises
    setSelectedExercises(prev => ({
      ...prev,
      [routineId]: []
    }));
    setShowExerciseModal(true);
  };

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const currentExercises = prev[selectedRoutineId] || [];
      
      // Check if exercise already selected
      const alreadySelected = currentExercises.some(e => e.id === exercise.id);
      
      let updatedExercises: Exercise[];
      if (alreadySelected) {
        // Remove from selection if already selected (toggle behavior)
        updatedExercises = [...currentExercises.filter(e => e.id !== exercise.id)];
      } else {
        // Add to selection if not already selected
        updatedExercises = [...currentExercises, exercise];
      }
      
      // Track unsaved changes
      setUnsavedChanges(prevChanges => new Set([...prevChanges, selectedRoutineId]));
      
      return {
        ...prev,
        [selectedRoutineId]: updatedExercises
      };
    });
  };

  const removeExercise = (routineId: string, exerciseId: string) => {
    setSelectedExercises(prev => ({
      ...prev,
      [routineId]: prev[routineId].filter(e => e.id !== exerciseId)
    }));
    
    // Track unsaved changes
    setUnsavedChanges(prevChanges => new Set([...prevChanges, routineId]));
  };

  const editExercise = (routineId: string, exercise: Exercise) => {
    // For now, just show an alert that editing is not implemented yet
    // You can extend this to open an edit modal or navigation
    Alert.alert('Edit Exercise', `Editing "${exercise.name}" is not yet implemented. This would open an edit interface.`);
  };

  const removeSavedExercise = async (routineId: string, exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routineId)
        .eq('exercise_id', exerciseId);

      if (error) throw error;
      
      // Update local state to remove the exercise
      setRoutines(prev => prev.map(routine => 
        routine.id === routineId 
          ? { ...routine, exercises: routine.exercises?.filter(e => e.id !== exerciseId) || [] }
          : routine
      ));
      
      Alert.alert('Success', 'Exercise removed from routine');
    } catch (error) {
      console.error('Error removing exercise:', error);
      Alert.alert('Error', 'Failed to remove exercise');
    }
  };

  
  const saveRoutineExercises = async (routineId: string) => {
    try {
      const exercises = selectedExercises[routineId] || [];
      
      // Get existing routine exercises to append to
      const routine = routines.find(r => r.id === routineId);
      const existingExercises = routine?.exercises || [];
      
      // Combine existing exercises with new ones (avoid duplicates)
      const existingExerciseIds = new Set(existingExercises.map(e => e.id));
      const newExercises = exercises.filter(e => !existingExerciseIds.has(e.id));
      const allExercises = [...existingExercises, ...newExercises];
      
      // Delete existing routine exercises
      await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routineId);
      
      // Insert all exercises (existing + new)
      if (allExercises.length > 0) {
        const { error } = await supabase
          .from('routine_exercises')
          .insert(
            allExercises.map(exercise => ({
              routine_id: routineId,
              exercise_id: exercise.id
            }))
          );
        
        if (error) throw error;
      }
      
      // Update local state with the new exercises
      const updatedRoutines = routines.map((routine: Routine) => 
        routine.id === routineId 
          ? { ...routine, exercises: allExercises }
          : routine
      );
      
      setRoutines(updatedRoutines);
      
      // Clear selected exercises for this routine after successful save
      setSelectedExercises((prev: {[key: string]: Exercise[]}) => {
        const newState = { ...prev };
        delete newState[routineId];
        return newState;
      });
      
      // Clear unsaved changes for this routine
      setUnsavedChanges(prevChanges => {
        const newChanges = new Set(prevChanges);
        newChanges.delete(routineId);
        return newChanges;
      });
      
      Alert.alert('Success', 'Exercises saved to routine');
    } catch (error) {
      console.error('Error saving routine exercises:', error);
      Alert.alert('Error', 'Failed to save exercises');
    }
  };

  const renderRoutineItem = ({ item: routine }: { item: Routine }) => (
    <View style={styles.routineCard}>
      <View style={styles.routineHeader}>
        <View style={styles.routineInfo}>
          <View style={styles.routineInfo}>
            <Text style={styles.routineName}>{routine.name}</Text>
            <Text style={styles.routineDate}>
              {formattedDate}
            </Text>
          </View>
        </View>
        <GhostButton
          title="Delete"
          onPress={() => deleteRoutine(routine.id)}
        />
      </View>

      {routine.exercises && routine.exercises.length > 0 && (
        <View style={styles.savedExercisesContainer}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.savedExercisesTitle}>Exercises ({routine.exercises.length})</Text>
          </View>
          {routine.exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <View style={styles.exerciseDot} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <GhostButton
                  title="×"
                  onPress={() => removeSavedExercise(routine.id, exercise.id)}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {selectedExercises[routine.id] && selectedExercises[routine.id].length > 0 && (
        <View style={styles.selectedExercisesContainer}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.selectedExercisesTitle}>
              Selected Exercises ({selectedExercises[routine.id].length})
            </Text>
            {unsavedChanges.has(routine.id) && (
              <GhostButton
                title="Save"
                onPress={() => saveRoutineExercises(routine.id)}
              />
            )}
          </View>
          {selectedExercises[routine.id].map((exercise) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <View style={styles.exerciseDot} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <GhostButton
                    title="Edit"
                    onPress={() => editExercise(routine.id, exercise)}
                  />
                  <GhostButton
                    title="×"
                    onPress={() => removeExercise(routine.id, exercise.id)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <GhostButton
        title="+ Add Exercise"
        onPress={() => openExerciseSelection(routine.id)}
      />
    </View>
  );

  const renderListHeader = () => (
    <>
      <StandardHeader title="Routines" />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>All Routines</Text>
          </View>
          {routines.length > 0 && (
            <GhostButton 
              title="+ Create Routine"
              onPress={() => setShowCreateModal(true)}
            />
          )}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <FlatList
        data={routines.length === 0 ? [] : routines}
        renderItem={renderRoutineItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchRoutines} />
        }
        ListHeaderComponent={renderListHeader}
        ItemSeparatorComponent={() => <View style={styles.routineSeparator} />}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.cardText}>Loading routines...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.cardText}>No routines yet</Text>
              <Text style={styles.cardSubtitle}>Create your first workout routine to get started</Text>
              <PrimaryButton
                title="Create Routine"
                onPress={() => setShowCreateModal(true)}
              />
            </View>
          )
        }
      />

      {/* Create Routine Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Routine</Text>
            
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Routine Name</Text>
              <Input
                value={newRoutineName}
                onChangeText={setNewRoutineName}
                placeholder="Enter routine name"
                placeholderTextColor={theme.colors.subtext}
                style={styles.input}
              />
            </View>

            <View style={styles.modalButtons}>
              <View style={styles.cancelButton}>
                <GhostButton
                  title="Cancel"
                  onPress={() => setShowCreateModal(false)}
                />
              </View>
              <View style={[styles.saveButton, !newRoutineName.trim() && styles.saveButtonDisabled]}>
                <PrimaryButton
                  title="Create"
                  onPress={createRoutine}
                  loading={creatingRoutine}
                  disabled={!newRoutineName.trim() || creatingRoutine}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Exercises</Text>
            
            <FlatList
              data={exercises}
              renderItem={({ item }) => {
                const isSelected = selectedExercises[selectedRoutineId]?.some(e => e.id === item.id);
                return (
                  <TouchableOpacity
                    style={styles.exerciseItemTouchable}
                    onPress={() => selectExercise(item)}
                  >
                    <View style={styles.exerciseItemContent}>
                      <Text style={styles.exerciseItemName}>{item.name}</Text>
                      <Text style={styles.exerciseItemSubtitle}>{item.muscle_group}</Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.selectedIndicator}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 400 }}
              contentContainerStyle={styles.exerciseListContent}
            />

            <View style={styles.modalButtons}>
              <View style={styles.cancelButton}>
                <GhostButton
                  title="Cancel"
                  onPress={() => setShowExerciseModal(false)}
                />
              </View>
              <View style={styles.doneButton}>
                <PrimaryButton
                  title="Done"
                  onPress={() => setShowExerciseModal(false)}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
