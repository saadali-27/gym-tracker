import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export default function ProgressScreen() {
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [muscleGroupFrequency, setMuscleGroupFrequency] = useState<{[key: string]: number}>({});
  const [trend, setTrend] = useState('No recent increase');
  const [totalWorkoutsThisWeek, setTotalWorkoutsThisWeek] = useState(0);
  const [mostTrainedMuscleGroup, setMostTrainedMuscleGroup] = useState('None');
  const [highestWeightLifted, setHighestWeightLifted] = useState('');
  const [averageRepsPerWorkout, setAverageRepsPerWorkout] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchProgressData();
    }, [])
  );

  const fetchProgressData = async () => {
    try {
      // Fetch workout entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('workout_entries')
        .select('*');

      if (entriesError) {
        console.error('Error fetching entries:', entriesError);
        setLoading(false);
        return;
      }

      // Fetch exercises for muscle groups
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*');

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError);
        setLoading(false);
        return;
      }

      // Fetch workouts for dates
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*');

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
        setLoading(false);
        return;
      }

      // Calculate weekly volume (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      console.log('All workouts from database:', workoutsData);
      console.log('Seven days ago date:', sevenDaysAgo);

      const weeklyWorkouts = workoutsData?.filter(workout => 
        new Date(workout.created_at) >= sevenDaysAgo
      ) || [];

      console.log('Filtered weekly workouts (unique sessions):', weeklyWorkouts);

      const weeklyWorkoutIds = weeklyWorkouts.map(w => w.id);
      console.log('Weekly workout IDs:', weeklyWorkoutIds);

      const weeklyEntries = entriesData?.filter(entry => 
        weeklyWorkoutIds.includes(entry.workout_id)
      ) || [];

      console.log('Weekly entries (all exercises from weekly workouts):', weeklyEntries);

      // Debug: Log each entry volume calculation
      console.log('Weekly entries:', weeklyEntries);
      
      const totalWeeklyVolume = weeklyEntries.reduce((sum, entry) => {
        const entryVolume = entry.sets * entry.reps * entry.weight;
        console.log(`Entry volume: ${entry.sets} × ${entry.reps} × ${entry.weight} = ${entryVolume}`);
        return sum + entryVolume;
      }, 0);
      
      console.log('Total weekly volume:', totalWeeklyVolume);

      // Calculate muscle group frequency
      const muscleFrequency: {[key: string]: number} = {};
      entriesData?.forEach(entry => {
        const exercise = exercisesData?.find(ex => ex.id === entry.exercise_id);
        if (exercise && exercise.muscle_group) {
          muscleFrequency[exercise.muscle_group] = (muscleFrequency[exercise.muscle_group] || 0) + 1;
        }
      });

      // Calculate improved trend
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const previousWeekWorkouts = workoutsData?.filter(workout => 
        new Date(workout.created_at) >= fourteenDaysAgo && new Date(workout.created_at) < sevenDaysAgo
      ) || [];

      const previousWeekWorkoutIds = previousWeekWorkouts.map(w => w.id);
      const previousWeekEntries = entriesData?.filter(entry => 
        previousWeekWorkoutIds.includes(entry.workout_id)
      ) || [];

      // Debug: Log previous week entries
      console.log('Previous week entries:', previousWeekEntries);

      const previousWeekVolume = previousWeekEntries.reduce((sum, entry) => {
        const entryVolume = entry.sets * entry.reps * entry.weight;
        console.log(`Previous week entry volume: ${entry.sets} × ${entry.reps} × ${entry.weight} = ${entryVolume}`);
        return sum + entryVolume;
      }, 0);

      console.log('Previous week total volume:', previousWeekVolume);

      // Calculate trend message
      let trendMessage;
      if (previousWeekVolume === 0) {
        trendMessage = "Start logging to see trends";
      } else if (totalWeeklyVolume > previousWeekVolume) {
        trendMessage = "You're improving 📈";
      } else if (totalWeeklyVolume < previousWeekVolume) {
        trendMessage = "You're declining 📉";
      } else {
        trendMessage = "You're consistent ➖";
      }

      console.log('Trend comparison:', { current: totalWeeklyVolume, previous: previousWeekVolume, message: trendMessage });

      // Calculate additional insights - FIX: Count unique workouts only
      const totalWorkoutsThisWeek = weeklyWorkouts.length;
      console.log('=== WORKOUT COUNT DEBUG ===');
      console.log('All workouts in database:', workoutsData?.length || 0);
      console.log('Filtered weekly workouts (unique sessions):', weeklyWorkouts);
      console.log('Total workouts this week (should be unique sessions):', totalWorkoutsThisWeek);
      console.log('Weekly entries count (exercises, should be higher):', weeklyEntries.length);
      console.log('Expected: If 1 workout has 4 exercises, workouts=1, entries=4');
      console.log('========================');

      // Find most trained muscle group
      const mostTrained = Object.entries(muscleFrequency).reduce((max, [muscle, count]) => 
        count > max.count ? { muscle, count } : max, { muscle: 'None', count: 0 }
      );
      console.log('Most trained muscle group:', mostTrained);

      // Calculate highest weight lifted (PR) with exercise details
      const highestWeightEntry = entriesData?.reduce((max, entry) => 
        entry.weight > max.weight ? entry : max, { weight: 0, exercise_id: '', id: '' }
      );
      console.log('Highest weight entry:', highestWeightEntry);

      // Get exercise details for the PR
      const prExercise = exercisesData?.find(ex => ex.id === highestWeightEntry.exercise_id);
      const prDisplay = prExercise 
        ? `${prExercise.name} — ${highestWeightEntry.weight}kg (${prExercise.muscle_group || 'Unknown'})`
        : 'No PR data';
      console.log('PR display:', prDisplay);

      // Calculate average reps per workout
      const totalReps = weeklyEntries.reduce((sum, entry) => sum + entry.reps, 0);
      const avgReps = totalWorkoutsThisWeek > 0 ? Math.round(totalReps / totalWorkoutsThisWeek) : 0;
      console.log('Average reps per workout:', avgReps);

      setWeeklyVolume(totalWeeklyVolume);
      setMuscleGroupFrequency(muscleFrequency);
      setTrend(trendMessage);
      setTotalWorkoutsThisWeek(totalWorkoutsThisWeek);
      setMostTrainedMuscleGroup(mostTrained.muscle);
      setHighestWeightLifted(prDisplay);
      setAverageRepsPerWorkout(avgReps);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track your fitness journey</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week Volume</Text>
          <View style={styles.card}>
            <Text style={styles.volumeNumber}>
              {loading ? 'Loading...' : weeklyVolume.toLocaleString()}
            </Text>
            <Text style={styles.volumeLabel}>Total kg lifted</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : totalWorkoutsThisWeek}
              </Text>
              <Text style={styles.statLabel}>Workouts This Week</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : averageRepsPerWorkout}
              </Text>
              <Text style={styles.statLabel}>Avg Reps/Workout</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          <View style={styles.card}>
            <Text style={styles.prLabel}>Personal Record</Text>
            <Text style={styles.prNumber}>
              {loading ? 'Loading...' : highestWeightLifted}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Groups</Text>
          <View style={styles.card}>
            {loading ? (
              <Text style={styles.cardText}>Loading...</Text>
            ) : Object.keys(muscleGroupFrequency).length === 0 ? (
              <Text style={styles.cardText}>No muscle group data yet</Text>
            ) : (
              <>
                <View style={styles.mostTrainedContainer}>
                  <Text style={styles.mostTrainedLabel}>Most Trained:</Text>
                  <Text style={styles.mostTrainedValue}>{mostTrainedMuscleGroup}</Text>
                </View>
                {Object.entries(muscleGroupFrequency).map(([muscle, count]) => (
                  <View key={muscle} style={styles.muscleGroupItem}>
                    <Text style={styles.muscleGroupName}>{muscle}</Text>
                    <Text style={styles.muscleGroupCount}>
                      — {count} {count === 1 ? 'time' : 'times'}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trend</Text>
          <View style={styles.card}>
            <Text style={styles.trendText}>
              {loading ? 'Loading...' : trend}
            </Text>
          </View>
        </View>
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
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  measurementCard: {
    flex: 1,
    minWidth: '45%',
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
  measurementLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
  volumeNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  muscleGroupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  muscleGroupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  muscleGroupCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  trendText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  prLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  prNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
  },
  mostTrainedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 4,
  },
  mostTrainedLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  mostTrainedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
