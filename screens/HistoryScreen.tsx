import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import { theme } from '../theme';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import Button from '../components/Button';

// STEP 2: SAFE DATE HANDLING
const safeDate = (value: any) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export default function HistoryScreen() {
  const [groupedWorkouts, setGroupedWorkouts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      console.log('DEBUG: Raw workouts data:', workoutsData?.map(w => ({
        id: w.id,
        routine_id: w.routine_id,
        routine_name: (w.routines as any)?.name,
        date: w.date
      })));

      workoutsData?.forEach(workout => {
        const dateKey = new Date(workout.date).toDateString();

        console.log('Processing workout:', {
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

      console.log('Final grouped structure:', grouped);

      setGroupedWorkouts(grouped);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <StatusBar style="light" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F8CFF"
            colors={["#4F8CFF"]}
          />
        }
      >
        <View style={{ 
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
          marginBottom: 20,
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '700', 
            color: '#E6EAF2',
            textAlign: 'center',
          }}>
            Workout History
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.colors.subtext,
            marginTop: 4,
          }}>
            Track your progress and templates
          </Text>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            marginTop: 8,
            marginBottom: 24,
          }}
        />

        {loading ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <Card>
              <Text style={{ 
                fontSize: 16, 
                color: theme.colors.text, 
                textAlign: 'center',
                fontWeight: '500',
              }}>
                Loading workouts...
              </Text>
            </Card>
          </View>
        ) : Object.keys(groupedWorkouts).length === 0 ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <Card style={{ padding: 24, borderRadius: 16 }}>
              <Text style={{ 
                fontSize: 18, 
                color: theme.colors.text, 
                textAlign: 'center',
                fontWeight: '700',
                marginBottom: theme.spacing.sm,
              }}>
                No workouts yet
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors.subtext, 
                textAlign: 'center',
                lineHeight: 20,
              }}>
                Start logging workouts to see your history and track progress
              </Text>
            </Card>
          </View>
        ) : (
          Object.entries(groupedWorkouts).map(([dateKey, routineGroups]: [string, any]) => (
            <View key={dateKey} style={styles.section}>
              {/* STEP 4: UI DISPLAY - Date Header */}
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>
                  {safeDate((Object.values(routineGroups)[0] as any)?.workouts?.[0]?.date)?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) || 'Unknown Date'}
                </Text>
              </View>

              {/* Each routine/custom workout as premium session card */}
              {Object.entries(routineGroups).map(([routineKey, routineGroup]: [string, any], index: number) => (
                <Card 
                  key={routineKey} 
                  style={{ 
                    marginBottom: theme.spacing.lg,
                    borderRadius: 16,
                    padding: 20,
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  {/* Header - Left: Routine Name, Right: Date */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: theme.spacing.md,
                  }}>
                    {/* Left: Routine Name */}
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: theme.colors.primary,
                        marginBottom: 4,
                      }}>
                        {routineGroup.routine_id ? routineGroup.routine_name : 'Custom Workout'}
                      </Text>
                    </View>
                    
                    {/* Right: Date + Delete Button */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        fontSize: 12,
                        color: theme.colors.subtext,
                        marginBottom: 8,
                      }}>
                        {safeDate(routineGroup.workouts?.[0]?.date)?.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) || 'Unknown Date'}
                      </Text>
                      
                      <AppButton
                        title="Delete"
                        variant="danger"
                        onPress={() => deleteWorkout(routineGroup.workouts[0]?.id)}
                      />
                    </View>
                  </View>

                  {/* Exercise List */}
                  <View style={{ gap: theme.spacing.md }}>
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

                      // Workout Summary
                      const totalExercises = Object.keys(exerciseGroups).length;
                      const totalSets = routineGroup.workouts.reduce((total: number, workout: any) => 
                        total + (workout.workout_entries?.length || 0), 0
                      );
                      const totalVolume = routineGroup.workouts.reduce((total: number, workout: any) => 
                        total + workout.workout_entries?.reduce((sum: number, entry: any) => 
                          sum + (entry.reps * entry.weight), 0
                        ) || 0, 0
                      );

                      return (
                        <>
                          {/* Workout Summary */}
                          <View style={{
                            backgroundColor: theme.colors.primary + '05',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: theme.colors.primary + '20',
                          }}>
                            <Text style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: theme.colors.primary,
                              marginBottom: 8,
                            }}>
                              Workout Summary
                            </Text>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                            }}>
                              <Text style={{
                                fontSize: 12,
                                color: theme.colors.text,
                              }}>
                                {totalExercises} exercises
                              </Text>
                              <Text style={{
                                fontSize: 12,
                                color: theme.colors.text,
                              }}>
                                {totalSets} sets
                              </Text>
                              <Text style={{
                                fontSize: 12,
                                color: theme.colors.text,
                              }}>
                                {totalVolume.toLocaleString()}kg total
                              </Text>
                            </View>
                          </View>

                          {/* Exercise Entries */}
                          {Object.entries(exerciseGroups).map(([exerciseName, entries]: [string, any], exerciseIndex: number) => (
                            <View key={exerciseName}>
                              {/* Exercise Name */}
                              <Text style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: '#ffffff',
                                marginBottom: theme.spacing.sm,
                              }}>
                                {exerciseName}
                              </Text>
                              
                              {/* Sets List */}
                              <View style={{ 
                                marginLeft: theme.spacing.sm,
                                marginBottom: theme.spacing.sm,
                              }}>
                                {(entries as any[]).map((entry: any, setIndex: number) => (
                                  <Text key={entry.id} style={{
                                    fontSize: 14,
                                    color: theme.colors.subtext,
                                    marginBottom: 2,
                                  }}>
                                    • {entry.reps} reps × {entry.weight}kg
                                  </Text>
                                ))}
                              </View>
                              
                              {/* Divider Line Between Exercises */}
                              {exerciseIndex < Object.entries(exerciseGroups).length - 1 && (
                                <View style={{
                                  borderBottomWidth: 1,
                                  borderColor: theme.colors.border,
                                  marginVertical: theme.spacing.sm,
                                }} />
                              )}
                            </View>
                          ))}
                        </>
                      );
                    })()}
                  </View>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// STEP 7: UI CLEANUP
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
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
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    paddingTop: 12,
  },
  dateHeader: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: theme.radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
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
    borderBottomColor: theme.colors.border,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
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
    borderBottomColor: theme.colors.border,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginLeft: 8,
  },
  exerciseGroup: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
});
