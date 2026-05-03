import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase, getCurrentUser } from '../services/supabase';
import { theme } from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import AppButton from '../components/AppButton';

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
  const [refreshing, setRefreshing] = useState(false);
  
  // Exercise selection state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<{[key: string]: Exercise[]}>({});

  useEffect(() => {
    fetchRoutinesWithExercises();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchRoutinesWithExercises();
      fetchExercises();
    }, [])
  );

  const fetchRoutinesWithExercises = async () => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      console.log("No user");
      setRoutines([]);
      return;
    }

    const { data: routinesData, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.log(error);
      return;
    }

    // Get all routine_exercises with exercise details
    const { data: routineExercises } = await supabase
      .from('routine_exercises')
      .select(`
        *,
        exercises (
          id,
          name,
          muscle_group
        )
      `);

    // Merge them
    const merged = (routinesData || []).map((routine) => {
      const exercises = (routineExercises || [])
        .filter((e) => e.routine_id === routine.id)
        .map((re) => re.exercises)
        .filter(Boolean);

      return {
        ...routine,
        exercises,
      };
    });

    setRoutines(merged);

  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false); // 🔥 THIS IS IMPORTANT
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoutinesWithExercises();
    await fetchExercises();
    setRefreshing(false);
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
      // Get current user
      const user = await getCurrentUser();
      
      // Insert routine into Supabase
      const { data, error } = await supabase
        .from('routines')
        .insert({
          name: newRoutineName.trim(),
          user_id: user?.id
        })
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
      fetchRoutinesWithExercises();
      
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
              fetchRoutinesWithExercises();
              
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
      console.log('� ADDING ROUTINE EXERCISES (APPEND MODE)');
      const routineExercisesData = exercisesToSave.map(exercise => ({
        routine_id: routineId,
        exercise_id: exercise.id
      }));

      // Get current user
      const user = await getCurrentUser();

      // Fetch existing exercises for this routine
      const { data: existingExercises } = await supabase
        .from('routine_exercises')
        .select('*')
        .eq('routine_id', routineId);

      // Prevent duplicates
      const existingExerciseIds = existingExercises?.map(e => e.exercise_id) || [];
      const newExercises = routineExercisesData.filter(
        (e) => !existingExerciseIds.includes(e.exercise_id)
      );

      console.log('📋 ROUTINE EXERCISES DATA TO INSERT:', newExercises);

      // Insert only new ones
      if (newExercises.length > 0) {
        const { data, error: insertError } = await supabase
          .from('routine_exercises')
          .insert(newExercises)
          .select();

        if (insertError) {
          console.error('❌ ERROR INSERTING ROUTINE EXERCISES:', insertError);
          console.error('Error details:', JSON.stringify(insertError, null, 2));
          Alert.alert('Error', 'Failed to save routine exercises');
          return;
        }

        console.log('✅ ROUTINE EXERCISES SAVED SUCCESSFULLY:', data);
        Alert.alert('Success', 'Routine exercises saved successfully');
        
        // Refresh to show updated exercises
        fetchRoutinesWithExercises();
      } else {
        console.log('ℹ️ NO NEW EXERCISES TO ADD');
        Alert.alert('Info', 'No new exercises to add');
      }
      
      // Clear selected exercises for this routine
      setSelectedExercises({
        ...selectedExercises,
        [routineId]: []
      });
      
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
              fetchRoutinesWithExercises();
              
            } catch (error) {
              console.error('❌ UNEXPECTED ERROR:', error);
              Alert.alert('Error', 'Failed to remove exercise');
            }
          }
        }
      ]
    );
  };

  const renderRoutineItem = ({ item: routine }: { item: Routine }) => (
              <View style={styles.routineCard}>
                <View style={styles.routineHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.routineInfo}>
                      <Text style={styles.routineName}>{routine.name}</Text>
                      <Text style={styles.routineDate}>
                        {new Date(routine.created_at + 'Z').toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <AppButton 
                    title="Delete"
                    variant="danger"
                    onPress={() => deleteRoutine(routine.id)}
                  />
                </View>
                
                <AppButton 
                  title="+ Add Exercise"
                  variant="secondary"
                  onPress={() => openExerciseSelection(routine.id)}
                />
                
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
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <View style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#7C9EFF',
                              marginRight: 10,
                            }} />
                            <Text style={{ color: '#E6EAF2', fontSize: 15 }}>
                              {exercise.name}
                            </Text>
                          </View>
                        </View>
                        <AppButton 
                          title="×"
                          variant="danger"
                          onPress={() => deleteRoutineExercise(routine.id, exercise.id)}
                        />
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
                      <AppButton 
                        title="Save"
                        variant="primary"
                        onPress={() => saveRoutineExercises(routine.id)}
                      />
                    </View>
                    {selectedExercises[routine.id].map((exercise) => (
                      <View key={exercise.id} style={styles.exerciseItem}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <View style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#7C9EFF',
                              marginRight: 10,
                            }} />
                            <Text style={{ color: '#E6EAF2', fontSize: 15 }}>
                              {exercise.name}
                            </Text>
                          </View>
                        </View>
                        <AppButton 
                          title="×"
                          variant="danger"
                          onPress={() => removeExercise(routine.id, exercise.id)}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
  );

  const renderListHeader = () => (
    <>
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
          My Routines
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>All Routines</Text>
          </View>
          <AppButton 
            title="+ Create Routine"
            variant="primary"
            onPress={() => setShowCreateModal(true)}
          />
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
        ) : null}
      </View>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={routines.length === 0 ? [] : routines}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutineItem}
        ListHeaderComponent={renderListHeader}
        ItemSeparatorComponent={() => <View style={styles.routineSeparator} />}
        style={styles.scrollView}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F8CFF"
            colors={["#4F8CFF"]}
          />
        }
      />

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
              <Input
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
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        marginBottom: 12,
                        borderRadius: 16,
                        backgroundColor: isSelected ? 'rgba(124,158,255,0.15)' : 'rgba(255,255,255,0.04)',
                        minHeight: 64,
                        justifyContent: 'center',
                      }}
                      onPress={() => selectExercise(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#E6EAF2',
                          marginBottom: 4,
                        }}>
                          {item.name}
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          color: '#9AA4B2',
                          opacity: 0.7,
                        }}>
                          {item.muscle_group}
                        </Text>
                      </View>
                      {isSelected && (
                        <Text style={{
                          fontSize: 18,
                          color: '#7C9EFF',
                          fontWeight: '600',
                        }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 140,
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 0,
    marginBottom: 24,
    flex: 1,
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  card: {
    backgroundColor: theme.colors.card,
    padding: 18,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: 4,
  },
  routinesList: {
    gap: 12,
  },
  routineCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  routineDate: {
    fontSize: 13,
    color: theme.colors.subtext,
  },
  deleteButton: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: '#E6EAF2',
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    color: '#0A0F1E',
    fontWeight: '600',
    backgroundColor: '#7C9EFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    color: theme.colors.border,
    backgroundColor: theme.colors.border,
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
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: theme.colors.card,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
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
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  testButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  // Exercises list styles
  refreshButton: {
    backgroundColor: theme.colors.subtext,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
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
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  exerciseItemMuscle: {
    fontSize: 14,
    color: theme.colors.subtext,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  // Exercise selection list styles
  exerciseSelection: {
    marginTop: 24,
  },
  exerciseSelectionList: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseSelectionItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseSelectionItemSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  exerciseSelectionItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  exerciseSelectionItemNameSelected: {
    color: theme.colors.primary,
  },
  exerciseSelectionItemMuscle: {
    fontSize: 12,
    color: theme.colors.subtext,
    backgroundColor: theme.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  removeExerciseButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeExerciseButtonText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  doneButton: {
    fontSize: 16,
    color: '#E6EAF2',
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  exerciseSelectionItemInfo: {
    flex: 1,
  },
  exerciseSelectionItemCheck: {
    fontSize: 18,
    color: theme.colors.primary,
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
    color: theme.colors.text,
    marginBottom: 12,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveExercisesButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  saveExercisesButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Improved UI styles
  loadingCard: {
    backgroundColor: theme.colors.card,
    padding: 24,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    padding: 24,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  scrollView: {
    flex: 1,
  },
});
