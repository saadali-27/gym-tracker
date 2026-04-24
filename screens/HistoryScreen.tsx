import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

// STEP 2: SAFE DATE HANDLING
const safeDate = (value: any) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export default function HistoryScreen() {
  const [groupedWorkouts, setGroupedWorkouts] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  // STEP 1: FETCH DATA
  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      
      // Fetch workouts with entries using proper join
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          routine_id,
          routines (
            name
          ),
          workout_entries (
            id,
            exercise_id,
            reps,
            weight,
            exercises (
              name
            )
          )
        `)
        .order('date', { ascending: false });

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
        return;
      }

      // STEP 3: CORRECT GROUPING - DATE → ROUTINE_ID → WORKOUTS
      const grouped: any = {};

      console.log('🔍 DEBUG: Raw workouts data:', workoutsData?.map(w => ({
        id: w.id,
        routine_id: w.routine_id,
        routine_name: (w.routines as any)?.name,
        date: w.date
      })));

      workoutsData?.forEach(workout => {
        const dateKey = new Date(workout.date).toDateString();

        console.log('📝 Processing workout:', {
          id: workout.id,
          routine_id: workout.routine_id,
          routine_name: (workout.routines as any)?.name,
          dateKey
        });

        // Step 1: Group by date
        if (!grouped[dateKey]) {
          grouped[dateKey] = {};
        }

        // Step 2: Group by routine_id (null = custom workout)
        const routineKey = workout.routine_id || 'custom';

        if (!grouped[dateKey][routineKey]) {
          grouped[dateKey][routineKey] = {
            routine_id: workout.routine_id,
            routine_name: (workout.routines as any)?.name || null,
            workouts: []
          };
        }

        grouped[dateKey][routineKey].workouts.push(workout);
      });

      console.log('📊 Final grouped structure:', grouped);

      setGroupedWorkouts(grouped);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // STEP 6: DELETE FIX
  const deleteWorkout = async (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete workout entries first (foreign key constraint)
              await supabase
                .from('workout_entries')
                .delete()
                .eq('workout_id', workoutId);

              // Delete the workout
              await supabase
                .from('workouts')
                .delete()
                .eq('id', workoutId);

              // Refresh data
              fetchWorkouts();
              
              Alert.alert('Success', 'Workout deleted successfully');
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your workout timeline</Text>
        </View>

        {loading ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardText}>Loading workouts...</Text>
            </View>
          </View>
        ) : Object.keys(groupedWorkouts).length === 0 ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardText}>No workouts logged yet</Text>
            </View>
          </View>
        ) : (
          Object.entries(groupedWorkouts).map(([dateKey, routineGroups]: [string, any]) => (
            <View key={dateKey} style={styles.section}>
              {/* STEP 4: UI DISPLAY - Date Header */}
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>
                  {safeDate(Object.values(routineGroups)[0]?.workouts?.[0]?.date)?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) || 'Unknown Date'}
                </Text>
              </View>

              {/* Each routine/custom workout as separate block */}
              {Object.entries(routineGroups).map(([routineKey, routineGroup]: [string, any], index: number) => (
                <View key={routineKey}>
                  <View style={styles.workoutCard}>
                    <View style={styles.workoutHeader}>
                      <Text style={styles.routineName}>
                        {routineGroup.routine_name || 'Custom Workout'}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteWorkout(routineGroup.workouts[0]?.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.exercisesContainer}>
                      {(() => {
                        // Group exercises by name within this routine group
                        const exerciseGroups: any = {};
                        routineGroup.workouts.forEach((workout: any) => {
                          workout.workout_entries?.forEach((entry: any) => {
                            const exerciseName = entry.exercises?.name || 'Unknown Exercise';
                            if (!exerciseGroups[exerciseName]) {
                              exerciseGroups[exerciseName] = [];
                            }
                            exerciseGroups[exerciseName].push(entry);
                          });
                        });
                        
                        return Object.entries(exerciseGroups).map(([exerciseName, entries]: [string, any]) => (
                          <View key={exerciseName} style={styles.exerciseGroup}>
                            <Text style={styles.exerciseName}>{exerciseName}</Text>
                            {entries.map((entry: any) => (
                              <Text key={entry.id} style={styles.exerciseDetails}>
                                • {entry.reps} reps × {entry.weight}kg
                              </Text>
                            ))}
                          </View>
                        ));
                      })()}
                    </View>
                  </View>
                  {/* Add divider between routine/custom blocks */}
                  {index < Object.keys(routineGroups).length - 1 && (
                    <View style={styles.sectionDivider} />
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// STEP 7: UI CLEANUP
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dateHeader: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  routineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  exercisesContainer: {
    padding: 16,
  },
  exerciseItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  exerciseGroup: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
});
