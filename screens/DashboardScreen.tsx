import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { getMostTrainedMuscle } from '../utils/muscleUtils';

const formatWeight = (value: number) => `${value.toLocaleString()} kg`;

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

        // Calculate most trained muscle group using volume
        const mostTrained = getMostTrainedMuscle(entriesData || []);
        setMostTrainedMuscle(mostTrained.muscle);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <StatusBar style="light" />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
            Dashboard
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

        {/* Fitness Stats - 2x2 Grid */}
        <View style={{
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: theme.spacing.md,
          }}>
            Fitness Stats
          </Text>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
          }}>
            <Card style={{ 
              width: '48%', 
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.card,
              borderRadius: 16,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.primary,
                textAlign: 'center',
                marginBottom: 4,
              }}>
                {formatWeight(totalVolume)}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.subtext,
                textAlign: 'center',
              }}>
                Total Volume
              </Text>
            </Card>
            
            <Card style={{ 
              width: '48%', 
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.card,
              borderRadius: 16,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.primary,
                textAlign: 'center',
                marginBottom: 4,
              }}>
                {totalReps.toLocaleString()}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.subtext,
                textAlign: 'center',
              }}>
                Total Reps
              </Text>
            </Card>
            
            <Card style={{ 
              width: '48%', 
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.card,
              borderRadius: 16,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.primary,
                textAlign: 'center',
                marginBottom: 4,
              }}>
                {totalSets}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.subtext,
                textAlign: 'center',
              }}>
                Total Sets
              </Text>
            </Card>
            
            <Card style={{ 
              width: '48%', 
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.card,
              borderRadius: 16,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.primary,
                textAlign: 'center',
                marginBottom: 4,
              }}>
                {mostTrainedMuscle}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.subtext,
                textAlign: 'center',
              }}>
                Most Trained
              </Text>
            </Card>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginTop: 24,
            marginBottom: 12,
          }}>
            Recent Activity
          </Text>
          {loading ? (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                color: theme.colors.text, 
                textAlign: 'center' 
              }}>
                Loading...
              </Text>
            </Card>
          ) : recentWorkouts.length === 0 ? (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                color: theme.colors.text, 
                textAlign: 'center' 
              }}>
                No recent workouts
              </Text>
            </Card>
          ) : (
            recentWorkouts.map((workout, index) => (
              <Card key={workout.id} style={{ 
                marginBottom: theme.spacing.md,
                marginTop: index === 0 ? 12 : 0 
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: theme.colors.text,
                  marginBottom: 4,
                }}>
                  {workout.routines?.name || 'Custom Workout'}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: theme.colors.subtext,
                  marginBottom: 4,
                }}>
                  {new Date(workout.date).toLocaleDateString()}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: theme.colors.primary,
                  fontWeight: '500',
                }}>
                  {workout.workout_entries?.length || 0} exercises
                </Text>
              </Card>
            ))
          )}
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
}
