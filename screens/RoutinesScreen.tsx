import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

interface Routine {
  id: string;
  name: string;
  created_at: string;
  exercises?: Exercise[];
}

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
}

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [creatingRoutine, setCreatingRoutine] = useState(false);
  
  // Exercise selection state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<{[key: string]: Exercise[]}>({});

  useFocusEffect(
    React.useCallback(() => {
      fetchRoutines();
      fetchExercises();
    }, [])
  );

  const fetchRoutines = async () => {
    console.log('🔍 FETCHING ROUTINES WITH EXERCISES');
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises (
            exercises (
              id,
              name,
              muscle_group
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching routines:', error);
        return;
      }

      console.log('📥 ROUTINES WITH EXERCISES RESPONSE:', data);
      
      // Format data and extract exercises
      const formattedRoutines = data?.map(routine => ({
        ...routine,
        exercises: routine.routine_exercises?.map((re: any) => re.exercises).filter(Boolean) || []
      })) || [];

      console.log('✅ FORMATTED ROUTINES WITH EXERCISES:', formattedRoutines);
      setRoutines(formattedRoutines);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    console.log('🔍 FETCHING EXERCISES');
    setExercisesLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching exercises:', error);
        return;
      }

      setExercises(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setExercisesLoading(false);
    }
  };

  const createRoutine = async () => {
    console.log('🟢 CREATE ROUTINE CLICKED');
    console.log('Routine name:', newRoutineName);
    
    if (!newRoutineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    setCreatingRoutine(true);
    try {
      // Insert routine into Supabase
      const { data, error } = await supabase
        .from('routines')
        .insert({ name: newRoutineName.trim() })
        .select()
        .single();

      if (error) {
        console.error('Error creating routine:', error);
        Alert.alert('Error', 'Failed to create routine');
        return;
      }

      console.log('✅ Routine created successfully:', data);
      Alert.alert('Success', 'Routine created successfully');

      // Reset form
      setNewRoutineName('');
      setShowCreateModal(false);
      fetchRoutines();
      
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Failed to create routine');
    } finally {
      setCreatingRoutine(false);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    console.log('🗑️ DELETE ROUTINE:', routineId);
    
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine?',
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

              if (error) {
                console.error('Error deleting routine:', error);
                Alert.alert('Error', 'Failed to delete routine');
                return;
              }

              console.log('✅ Routine deleted successfully');
              Alert.alert('Success', 'Routine deleted successfully');
              fetchRoutines();
              
            } catch (error) {
              console.error('Unexpected error:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          }
        }
      ]
    );
  };

  const openExerciseSelection = (routineId: string) => {
    console.log('🔵 OPEN EXERCISE SELECTION FOR ROUTINE:', routineId);
    setSelectedRoutineId(routineId);
    setShowExerciseModal(true);
  };

  const selectExercise = (exercise: Exercise) => {
    if (!selectedRoutineId) return;

    console.log('🟢 SELECT EXERCISE:', exercise.name);
    
    const currentSelected = selectedExercises[selectedRoutineId] || [];
    
    // Prevent duplicates
    const isAlreadySelected = currentSelected.some(selected => selected.id === exercise.id);
    
    if (isAlreadySelected) {
      console.log('⚠️ Exercise already selected, removing');
      const updated = currentSelected.filter(ex => ex.id !== exercise.id);
      setSelectedExercises({
        ...selectedExercises,
        [selectedRoutineId]: updated
      });
    } else {
      console.log('✅ Adding exercise to selection');
      setSelectedExercises({
        ...selectedExercises,
        [selectedRoutineId]: [...currentSelected, exercise]
      });
    }
  };

  const removeExercise = (routineId: string, exerciseId: string) => {
    console.log('🗑️ REMOVE EXERCISE FROM ROUTINE:', routineId);
    
    const currentSelected = selectedExercises[routineId] || [];
    const updated = currentSelected.filter(ex => ex.id !== exerciseId);
    
    setSelectedExercises({
      ...selectedExercises,
      [routineId]: updated
    });
  };

  const saveRoutineExercises = async (routineId: string) => {
    console.log('💾 SAVE ROUTINE EXERCISES FOR ROUTINE:', routineId);
    
    const exercisesToSave = selectedExercises[routineId] || [];
    
    if (exercisesToSave.length === 0) {
      console.log('ℹ️ No exercises to save');
      return;
    }

    console.log('📋 EXERCISES TO SAVE:', exercisesToSave);
    
    try {
      // First, delete existing exercises for this routine
      console.log('🗑️ DELETING EXISTING ROUTINE EXERCISES');
      const { error: deleteError } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routineId);

      if (deleteError) {
        console.error('❌ ERROR DELETING EXISTING EXERCISES:', deleteError);
        Alert.alert('Error', 'Failed to update routine exercises');
        return;
      }

      console.log('✅ EXISTING EXERCISES DELETED');

      // Insert new exercises
      console.log('📤 INSERTING NEW ROUTINE EXERCISES');
      const routineExercisesData = exercisesToSave.map(exercise => ({
        routine_id: routineId,
        exercise_id: exercise.id
      }));

      console.log('📋 ROUTINE EXERCISES DATA TO INSERT:', routineExercisesData);

      const { data, error: insertError } = await supabase
        .from('routine_exercises')
        .insert(routineExercisesData)
        .select();

      if (insertError) {
        console.error('❌ ERROR INSERTING ROUTINE EXERCISES:', insertError);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        Alert.alert('Error', 'Failed to save routine exercises');
        return;
      }

      console.log('✅ ROUTINE EXERCISES SAVED SUCCESSFULLY:', data);
      Alert.alert('Success', 'Routine exercises saved successfully');
      
      // Clear selected exercises for this routine
      setSelectedExercises({
        ...selectedExercises,
        [routineId]: []
      });
      
      // Refresh routines to show saved exercises
      fetchRoutines();
      
    } catch (error) {
      console.error('❌ UNEXPECTED ERROR SAVING ROUTINE EXERCISES:', error);
      Alert.alert('Error', 'Failed to save routine exercises');
    }
  };

  const deleteRoutineExercise = async (routineId: string, exerciseId: string) => {
    console.log('🗑️ DELETE ROUTINE EXERCISE:', { routineId, exerciseId });
    
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise from the routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('routine_exercises')
                .delete()
                .eq('routine_id', routineId)
                .eq('exercise_id', exerciseId);

              if (error) {
                console.error('❌ ERROR DELETING ROUTINE EXERCISE:', error);
                Alert.alert('Error', 'Failed to remove exercise');
                return;
              }

              console.log('✅ ROUTINE EXERCISE DELETED SUCCESSFULLY');
              Alert.alert('Success', 'Exercise removed from routine');
              fetchRoutines();
              
            } catch (error) {
              console.error('❌ UNEXPECTED ERROR:', error);
              Alert.alert('Error', 'Failed to remove exercise');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routines</Text>
        <Text style={styles.subtitle}>Your workout programs</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Routines</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.createButtonText}>+ Create Routine</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.cardText}>Loading routines...</Text>
          </View>
        ) : routines.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.cardText}>No routines found</Text>
            <Text style={styles.cardSubtitle}>Create your first routine to get started</Text>
          </View>
        ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            renderItem={({ item: routine }) => (
              <View style={styles.routineCard}>
                <View style={styles.routineHeader}>
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineDate}>
                      {new Date(routine.created_at + 'Z').toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteRoutine(routine.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.addExerciseButton}
                  onPress={() => openExerciseSelection(routine.id)}
                >
                  <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
                </TouchableOpacity>
                
                {/* Saved Exercises from Database */}
                {routine.exercises && routine.exercises.length > 0 && (
                  <View style={styles.savedExercisesContainer}>
                    <View style={styles.exercisesHeader}>
                      <Text style={styles.savedExercisesTitle}>
                        Exercises ({routine.exercises.length})
                      </Text>
                    </View>
                    {routine.exercises.map((exercise) => (
                      <View key={exercise.id} style={styles.exerciseItem}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <TouchableOpacity 
                          style={styles.removeExerciseButton}
                          onPress={() => deleteRoutineExercise(routine.id, exercise.id)}
                        >
                          <Text style={styles.removeExerciseButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Selected Exercises (not yet saved) */}
                {selectedExercises[routine.id] && selectedExercises[routine.id].length > 0 && (
                  <View style={styles.selectedExercisesContainer}>
                    <View style={styles.exercisesHeader}>
                      <Text style={styles.selectedExercisesTitle}>
                        Selected to Add ({selectedExercises[routine.id].length})
                      </Text>
                      <TouchableOpacity 
                        style={styles.saveExercisesButton}
                        onPress={() => saveRoutineExercises(routine.id)}
                      >
                        <Text style={styles.saveExercisesButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                    {selectedExercises[routine.id].map((exercise) => (
                      <View key={exercise.id} style={styles.exerciseItem}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <TouchableOpacity 
                          style={styles.removeExerciseButton}
                          onPress={() => removeExercise(routine.id, exercise.id)}
                        >
                          <Text style={styles.removeExerciseButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.routinesListContainer}
            ItemSeparatorComponent={() => <View style={styles.routineSeparator} />}
          />
        )}
      </View>

      {/* Create Routine Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Routine</Text>
            <TouchableOpacity 
              onPress={createRoutine} 
              disabled={creatingRoutine || !newRoutineName.trim()}
            >
              <Text style={[
                styles.saveButton,
                (creatingRoutine || !newRoutineName.trim()) && styles.saveButtonDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Routine Name</Text>
              <TextInput
                style={styles.textInput}
                value={newRoutineName}
                onChangeText={setNewRoutineName}
                placeholder="Enter routine name"
                autoFocus
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Exercises</Text>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {exercisesLoading ? (
              <View style={styles.card}>
                <Text style={styles.cardText}>Loading exercises...</Text>
              </View>
            ) : (
              <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const currentSelected = selectedRoutineId ? (selectedExercises[selectedRoutineId] || []) : [];
                  const isSelected = currentSelected.some(exercise => exercise.id === item.id);
                  
                  return (
                    <TouchableOpacity
                      style={[
                        styles.exerciseSelectionItem,
                        isSelected && styles.exerciseSelectionItemSelected
                      ]}
                      onPress={() => selectExercise(item)}
                    >
                      <View style={styles.exerciseSelectionItemInfo}>
                        <Text style={[
                          styles.exerciseSelectionItemName,
                          isSelected && styles.exerciseSelectionItemNameSelected
                        ]}>
                          {item.name}
                        </Text>
                        <Text style={styles.exerciseSelectionItemMuscle}>
                          {item.muscle_group}
                        </Text>
                      </View>
                      {isSelected && (
                        <Text style={styles.exerciseSelectionItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.exerciseListContainer}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 0,
    marginBottom: 20,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  routinesList: {
    gap: 12,
  },
  routineCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 16,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  routineDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#d1d5db',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Exercise buttons styles
  exerciseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  // Exercises list styles
  refreshButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  exercisesListContainer: {
    gap: 8,
  },
  exerciseListItemSimple: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseListItemNameSimple: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  exerciseListItemMuscleSimple: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  // Exercise selection list styles
  exerciseSelectionList: {
    marginTop: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    maxHeight: 200,
  },
  exerciseSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  exerciseSelectionItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseSelectionItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  exerciseSelectionItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  exerciseSelectionItemNameSelected: {
    color: '#3b82f6',
  },
  exerciseSelectionItemMuscle: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textTransform: 'capitalize',
  },
  // Exercise selection styles
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  addExerciseButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  selectedExercisesContainer: {
    marginTop: 12,
  },
  selectedExercisesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  removeExerciseButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeExerciseButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  doneButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  exerciseSelectionItemInfo: {
    flex: 1,
  },
  exerciseSelectionItemCheck: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  exerciseListContainer: {
    padding: 8,
  },
  // Saved exercises styles
  savedExercisesContainer: {
    marginTop: 12,
  },
  savedExercisesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveExercisesButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveExercisesButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Improved UI styles
  loadingCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  routinesListContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  routineSeparator: {
    height: 12,
  },
});
