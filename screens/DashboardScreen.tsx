import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export default function DashboardScreen() {
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [mostTrainedMuscle, setMostTrainedMuscle] = useState('None');

  // Helper function to get start of week
  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0 Sunday
    const diff = now.getDate() - day;
    const start = new Date(now.setDate(diff));
    start.setHours(0,0,0,0);
    return start.toISOString();
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL workout_entries for comprehensive stats
      const { data: entriesData, error: entriesError } = await supabase
        .from('workout_entries')
        .select(`
          id,
          reps,
          weight,
          exercises!inner(
            id,
            name,
            muscle_group
          ),
          workouts!inner(
            id,
            date
          )
        `);

      if (entriesError) {
        console.error('Error fetching entries data:', entriesError);
      } else {
        // Helper to safely access nested data
        const getExerciseData = (entry: any) => Array.isArray(entry.exercises) ? entry.exercises[0] : entry.exercises;
        const getWorkoutData = (entry: any) => Array.isArray(entry.workouts) ? entry.workouts[0] : entry.workouts;

        // Calculate total volume (reps × weight)
        const volume = entriesData?.reduce((sum, e) => sum + (e.reps * e.weight), 0) || 0;
        setTotalVolume(volume);

        // Calculate total reps
        const reps = entriesData?.reduce((sum, e) => sum + e.reps, 0) || 0;
        setTotalReps(reps);

        // Calculate total sets (each entry is one set)
        const sets = entriesData?.length || 0;
        setTotalSets(sets);

        // Calculate most trained muscle group
        const muscleFreq: { [key: string]: number } = {};
        entriesData?.forEach(e => {
          const exercise = getExerciseData(e);
          const muscleGroup = exercise?.muscle_group;
          if (muscleGroup) {
            muscleFreq[muscleGroup] = (muscleFreq[muscleGroup] || 0) + 1;
          }
        });
        const mostMuscle = Object.keys(muscleFreq).reduce((a, b) => muscleFreq[a] > muscleFreq[b] ? a : b, 'None');
        setMostTrainedMuscle(mostMuscle);
      }

      // Fetch total workouts count
      const { count: totalCount, error: totalError } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error fetching total workouts:', totalError);
      } else {
        setTotalWorkouts(totalCount || 0);
      }

      // Fetch weekly workouts count
      const startOfWeek = getStartOfWeek();
      const { count: weeklyCount, error: weeklyError } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .gte('date', startOfWeek);

      if (weeklyError) {
        console.error('Error fetching weekly workouts:', weeklyError);
      } else {
        setWeeklyWorkouts(weeklyCount || 0);
      }

      // Fetch recent workouts (last 3 sessions)
      const { data: recentData, error: recentError } = await supabase
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
        .order('date', { ascending: false })
        .limit(3);

      if (recentError) {
        console.error('Error fetching recent workouts:', recentError);
      } else {
        setRecentWorkouts(recentData || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{weeklyWorkouts}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {loading ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>Loading...</Text>
            </View>
          ) : recentWorkouts.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>No recent workouts</Text>
            </View>
          ) : (
            recentWorkouts.map((workout) => (
              <View key={workout.id} style={styles.recentWorkoutCard}>
                <Text style={styles.recentWorkoutTitle}>
                  {workout.routines?.name || 'Custom Workout'}
                </Text>
                <Text style={styles.recentWorkoutDate}>
                  {new Date(workout.date).toLocaleDateString()}
                </Text>
                <Text style={styles.recentWorkoutExercises}>
                  {workout.workout_entries?.length || 0} exercises
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Stats</Text>
          <View style={styles.fitnessStatsGrid}>
            {/* Row 1 */}
            <View style={styles.fitnessStatCard}>
              <Text style={styles.fitnessStatNumber}>{(totalVolume / 1000).toFixed(1)}k</Text>
              <Text style={styles.fitnessStatLabel} numberOfLines={1}>Volume</Text>
            </View>
            <View style={styles.fitnessStatCard}>
              <Text style={styles.fitnessStatNumber}>{totalReps.toLocaleString()}</Text>
              <Text style={styles.fitnessStatLabel} numberOfLines={1}>Reps</Text>
            </View>
            {/* Row 2 */}
            <View style={styles.fitnessStatCard}>
              <Text style={styles.fitnessStatNumber}>{totalSets}</Text>
              <Text style={styles.fitnessStatLabel} numberOfLines={1}>Sets</Text>
            </View>
            <View style={styles.fitnessStatCard}>
              <Text style={styles.fitnessStatNumber}>{mostTrainedMuscle}</Text>
              <Text style={styles.fitnessStatLabel} numberOfLines={1}>Top Muscle</Text>
            </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  fitnessStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  fitnessStatCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  fitnessStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 4,
  },
  fitnessStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
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
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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
  recentWorkoutCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentWorkoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  recentWorkoutDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  recentWorkoutExercises: {
    fontSize: 12,
    color: '#3b82f6',
  },
});
