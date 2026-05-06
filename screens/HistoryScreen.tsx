import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import { theme } from '../theme';
import { AppHeader, RowItem, SectionLabel, StatBox, PrimaryButton, GhostButton, StandardHeader } from '../components';
import Card from '../components/Card';

const safeDate = (value: any) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

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
  loadingContainer: {
    marginTop: theme.spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyCard: {
    padding: theme.spacing.lg,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  workoutCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: 16,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  routineName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.sm,
  },
  exercisesContainer: {
    gap: theme.spacing.md,
  },
  workoutSummary: {
    backgroundColor: theme.colors.primary + '05',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  workoutSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  workoutSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutSummaryText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  setsList: {
    marginLeft: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  setItem: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 2,
  },
  exerciseDivider: {
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  dateHeader: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
});

const parseWorkoutDate = (dateValue: any) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date;
};

const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

const getCurrentDayLabel = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1;
  return days[adjustedToday];
};

export default function HistoryScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groupedWorkouts, setGroupedWorkouts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useFocusEffect(
    React.useCallback(() => {
      setCurrentDate(new Date());
      fetchWorkouts();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);

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

      const grouped: any = {};

      workoutsData?.forEach((workout) => {
        const workoutDate = parseWorkoutDate(workout.date);
        const dateKey = workoutDate ? workoutDate.toDateString() : 'invalid';

        if (!grouped[dateKey]) {
          grouped[dateKey] = {};
        }

        const routineKey = workout.routine_id || 'custom';

        if (!grouped[dateKey][routineKey]) {
          grouped[dateKey][routineKey] = {
            routine_id: workout.routine_id,
            routine_name: (workout.routines as any)?.name || null,
            workouts: [],
          };
        }

        grouped[dateKey][routineKey].workouts.push(workout);
      });

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

  const deleteWorkout = async (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('workout_entries').delete().eq('workout_id', workoutId);
              await supabase.from('workouts').delete().eq('id', workoutId);
              fetchWorkouts();
              Alert.alert('Success', 'Workout deleted successfully');
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  const totalSessions = Object.keys(groupedWorkouts).reduce((total, dateKey) => {
    return total + Object.keys(groupedWorkouts[dateKey]).length;
  }, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
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
            colors={['#4F8CFF']}
          />
        }
      >
        <StandardHeader title="History" />
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
          <>
            {Object.entries(groupedWorkouts).map(([dateKey, routineGroups]: [string, any]) => (
              <View key={dateKey} style={styles.section}>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText}>
                    {(() => {
                      const firstWorkout = Object.values(routineGroups as any)[0] as any;
                      const date = parseWorkoutDate(firstWorkout?.workouts?.[0]?.date);
                      return date
                        ? date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : dateKey;
                    })()}
                  </Text>
                </View>

                {/* Each routine/custom workout as session card */}
                {Object.entries(routineGroups).map(([routineKey, routineGroup]: [string, any]) => {
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

                  const totalExercises = Object.keys(exerciseGroups).length;
                  const totalSets = routineGroup.workouts.reduce(
                    (total: number, workout: any) => total + (workout.workout_entries?.length || 0),
                    0
                  );
                  const totalVolume = routineGroup.workouts.reduce(
                    (total: number, workout: any) =>
                      total +
                      (workout.workout_entries?.reduce(
                        (sum: number, entry: any) => sum + entry.reps * entry.weight,
                        0
                      ) || 0),
                    0
                  );

                  return (
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
                      {/* Header */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: theme.spacing.md,
                      }}>
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

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{
                            fontSize: 12,
                            color: theme.colors.subtext,
                            marginBottom: 8,
                          }}>
                            {formattedDate}
                          </Text>
                          <GhostButton
                            title="Delete"
                            onPress={() => deleteWorkout(routineGroup.workouts[0]?.id)}
                          />
                        </View>
                      </View>

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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: theme.colors.text }}>{totalExercises} exercises</Text>
                          <Text style={{ fontSize: 12, color: theme.colors.text }}>{totalSets} sets</Text>
                          <Text style={{ fontSize: 12, color: theme.colors.text }}>{totalVolume.toLocaleString()}kg total</Text>
                        </View>
                      </View>

                      {/* Exercise Entries */}
                      <View style={{ gap: theme.spacing.md }}>
                        {Object.entries(exerciseGroups).map(([exerciseName, entries]: [string, any], exerciseIndex: number) => (
                          <View key={exerciseName}>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: 'bold',
                              color: '#ffffff',
                              marginBottom: theme.spacing.sm,
                            }}>
                              {exerciseName}
                            </Text>

                            <View style={{ marginLeft: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                              {(entries as any[]).map((entry: any) => (
                                <Text key={entry.id} style={{
                                  fontSize: 14,
                                  color: theme.colors.subtext,
                                  marginBottom: 2,
                                }}>
                                  • {entry.reps} reps × {entry.weight}kg
                                </Text>
                              ))}
                            </View>

                            {exerciseIndex < Object.entries(exerciseGroups).length - 1 && (
                              <View style={{
                                borderBottomWidth: 1,
                                borderColor: theme.colors.border,
                                marginVertical: theme.spacing.sm,
                              }} />
                            )}
                          </View>
                        ))}
                      </View>
                    </Card>
                  );
                })}
              </View>
            ))}

            {/* Total Sessions All Time */}
            <View style={{
              flexDirection: 'row',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              paddingHorizontal: theme.spacing.lg,
            }}>
              <Card style={{ flex: 1, padding: 20, alignItems: 'center' }}>
                <Text style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: theme.colors.primary,
                  marginBottom: 8,
                }}>
                  {totalSessions}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: theme.colors.subtext,
                  textAlign: 'center',
                }}>
                  Total sessions all time
                </Text>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
