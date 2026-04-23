import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const fetchWorkouts = async () => {
    try {
      // Fetch workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
        setLoading(false);
        return;
      }

      // Debug: Log raw workouts data
      console.log('Raw workouts data:', workoutsData);

      // Fetch all workout entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('workout_entries')
        .select('*');

      if (entriesError) {
        console.error('Error fetching entries:', entriesError);
        setLoading(false);
        return;
      }

      // Debug: Log raw entries data
      console.log('Raw workout_entries data:', entriesData);

      // Fetch all exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*');

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError);
        setLoading(false);
        return;
      }

      // Debug: Log exercises data
      console.log('Raw exercises data:', exercisesData);

      // Group workouts by date
      const workoutsWithEntries = workoutsData?.map(workout => {
        const entries = entriesData?.filter(entry => entry.workout_id === workout.id) || [];
        console.log(`Workout ${workout.id} has ${entries.length} entries`);
        
        const entriesWithExerciseNames = entries.map(entry => {
          const exercise = exercisesData?.find(ex => ex.id === entry.exercise_id);
          return {
            ...entry,
            exercise_name: exercise?.name || 'Unknown Exercise'
          };
        });

        return {
          ...workout,
          workout_entries: entriesWithExerciseNames
        };
      }) || [];

      // Group by date (ignore time)
      const groupedByDate = workoutsWithEntries.reduce((acc: any, workout) => {
        const date = workout.created_at.split(' ')[0]; // Get YYYY-MM-DD format directly
        
        if (!acc[date]) {
          acc[date] = {
            date: date,
            workout_entries: []
          };
        }
        
        acc[date].workout_entries.push(...workout.workout_entries);
        return acc;
      }, {});

      // Convert to array and sort by date (newest first)
      const groupedWorkouts = Object.values(groupedByDate).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Debug: Log the grouped data
      console.log('Grouped workouts by date:', groupedWorkouts);

      setWorkouts(groupedWorkouts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const deleteWorkout = async (date: string) => {
    Alert.alert(
      'Delete All Workouts',
      `Are you sure you want to delete all workouts from ${formatDate(date)}?`,
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
              // First get all workout IDs for this date using proper date range
              const startOfDay = new Date(date);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(date);
              endOfDay.setHours(23, 59, 59, 999);

              // Use date-only format to avoid timezone issues
              const startOfDayString = startOfDay.toISOString().split('T')[0] + ' 00:00:00';
              const endOfDayString = endOfDay.toISOString().split('T')[0] + ' 23:59:59';
              
              const { data: workoutsData, error: fetchError } = await supabase
                .from('workouts')
                .select('id')
                .gte('created_at', startOfDayString)
                .lte('created_at', endOfDayString);

              if (fetchError) {
                console.error('Error fetching workouts:', fetchError);
                Alert.alert('Error', 'Failed to fetch workouts');
                return;
              }

              const workoutIds = workoutsData?.map(w => w.id) || [];
              
              if (workoutIds.length === 0) {
                Alert.alert('Info', 'No workouts found for this date');
                return;
              }

              // Delete all workout entries for these workouts
              const { error: entriesError } = await supabase
                .from('workout_entries')
                .delete()
                .in('workout_id', workoutIds);

              if (entriesError) {
                console.error('Error deleting entries:', entriesError);
                Alert.alert('Error', 'Failed to delete workout entries');
                return;
              }

              // Delete all workouts for this date
              const { error: workoutError } = await supabase
                .from('workouts')
                .delete()
                .in('id', workoutIds);

              if (workoutError) {
                console.error('Error deleting workouts:', workoutError);
                Alert.alert('Error', 'Failed to delete workouts');
                return;
              }

              // Update UI by removing the date from state
              setWorkouts(prev => prev.filter(w => w.date !== date));
              
              Alert.alert('Success', `All workouts from ${formatDate(date)} deleted successfully`);
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'Failed to delete workouts');
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
        ) : workouts.length === 0 ? (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardText}>No workouts logged yet</Text>
            </View>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout.date} style={styles.section}>
              <View style={styles.workoutHeader}>
                <Text style={styles.sectionTitle}>
                  Date: {formatDate(workout.date)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteWorkout(workout.date)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                {workout.workout_entries?.map((entry: any) => (
                  <View key={entry.id} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>
                      {entry.exercise_name || 'Unknown Exercise'}
                    </Text>
                    <Text style={styles.exerciseDetails}>
                      {entry.sets} sets × {entry.reps} reps × {entry.weight}kg
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  exerciseItem: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
});
