import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { supabase, signUpUser, signInUser, getCurrentUser } from '../services/supabase';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { getMostTrainedMuscle } from '../utils/muscleUtils';

const formatWeight = (value: number) => `${value.toLocaleString()} kg`;

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);
  const [mostTrainedMuscle, setMostTrainedMuscle] = useState('None');
  const [recentRoutine, setRecentRoutine] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [mostTrained, setMostTrained] = useState("");

  // Helper function to get start of week
  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
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

      // Fetch most recent routine for Today's Focus
      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (routineError) {
        console.error('Error fetching recent routine:', routineError);
      } else {
        setRecentRoutine(routineData && routineData.length > 0 ? routineData[0] : null);
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
      
      // Smart Dashboard Logic - refresh on focus
      const fetchSmartData = async () => {
        const user = await getCurrentUser();

        if (!user) return;

        // fetch workouts
        const { data: workoutsData } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id);

        setWorkouts(workoutsData || []);

        // fetch workout entries (for muscle analysis)
        const { data: entries } = await supabase
          .from('workout_entries')
          .select(`
            *,
            exercises!inner (
              muscle_group
            ),
            workouts!inner (
              user_id
            )
          `)
          .eq('workouts.user_id', user.id);

        // COUNT MUSCLE FREQUENCY
        const muscleCount: {[key: string]: number} = {};

        entries?.forEach((e: any) => {
          // Helper to safely access nested exercise data
          const exercise = Array.isArray(e.exercises) ? e.exercises[0] : e.exercises;
          const muscle = exercise?.muscle_group || "Other";

          muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
        });

        const sorted = Object.entries(muscleCount).sort((a, b) => (b[1] as number) - (a[1] as number));

        if (sorted.length > 0) {
          setMostTrained(sorted[0][0] as string);
        } else {
          setMostTrained("");
        }
      };

      fetchSmartData();
      
      const testAuth = async () => {
        const email = "test123@gmail.com";
        const password = "12345678";

        const signUpRes = await signUpUser(email, password);
        console.log("SIGN UP:", signUpRes);

        const signInRes = await signInUser(email, password);
        console.log("SIGN IN:", signInRes);

        const user = await getCurrentUser();
        console.log("AUTH USER:", user);
      };

      testAuth();
    }, [])
  );

  
  // TODAY'S FOCUS LOGIC
  let focusTitle = "Start a workout 💪";
  let focusSub = "Build consistency";

  if (workouts.length > 0) {
    focusTitle = "Stay consistent 💪";
    focusSub = "Keep pushing your progress";
  }

  // MICRO INSIGHT
  let insight = "";

  if (workouts.length === 0) {
    insight = "Start your fitness journey 🚀";
  } else if (workouts.length < 3) {
    insight = "You're building momentum 💪";
  } else {
    insight = "Great consistency this week 🔥";
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <StatusBar style="light" />
      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
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

        {/* Welcome Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            color: '#E6EAF2',
            fontSize: 20,
            fontWeight: '600'
          }}>
            Welcome back 👋
          </Text>

          <Text style={{
            color: '#9AA4B2',
            fontSize: 14,
            marginTop: 4
          }}>
            Stay consistent today
          </Text>
        </View>

        {/* Today's Focus */}
        <View style={{
          backgroundColor: '#0f172a',
          borderRadius: 18,
          padding: 18,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1e293b'
        }}>
          <Text style={{
            color: '#9AA4B2',
            fontSize: 13,
            marginBottom: 6
          }}>
            TODAY'S FOCUS
          </Text>

          <Text style={{
            color: '#E6EAF2',
            fontSize: 20,
            fontWeight: '600'
          }}>
            {focusTitle}
          </Text>

          <Text style={{
            color: '#9AA4B2',
            marginTop: 6
          }}>
            {focusSub}
          </Text>

          <Text style={{
            color: '#9AA4B2',
            marginTop: 8
          }}>
            {insight}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            color: '#E6EAF2',
            fontSize: 16,
            marginBottom: 10
          }}>
            Quick Actions
          </Text>

          <View style={{
            flexDirection: 'row',
            gap: 10
          }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: '#7C9EFF',
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center'
              }}
              onPress={() => navigation.navigate('Log' as never)}
            >
              <Text style={{ color: '#0A0F1E', fontWeight: '600' }}>
                Start Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
              }}
              onPress={() => navigation.navigate('Routines' as never)}
            >
              <Text style={{ color: '#E6EAF2' }}>
                Routines
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Most Trained Muscle */}
        <View style={{
          backgroundColor: '#0f172a',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1e293b'
        }}>
          <Text style={{
            color: '#9AA4B2',
            fontSize: 13,
            marginBottom: 6
          }}>
            MOST TRAINED
          </Text>

          <Text style={{
            color: '#E6EAF2',
            fontSize: 18,
            fontWeight: '600'
          }}>
            {mostTrained || "No data yet"}
          </Text>
        </View>

        {/* Recent Activity */}
        <View>
          <Text style={{
            color: '#E6EAF2',
            fontSize: 16,
            marginBottom: 10
          }}>
            Recent Activity
          </Text>

          {loading ? (
            <View style={{
              backgroundColor: '#0f172a',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#1e293b'
            }}>
              <Text style={{ color: '#E6EAF2', fontSize: 15 }}>
                Loading...
              </Text>
            </View>
          ) : recentWorkouts.length === 0 ? (
            <View style={{
              backgroundColor: '#0f172a',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#1e293b'
            }}>
              <Text style={{ color: '#E6EAF2', fontSize: 15 }}>
                No recent workouts
              </Text>
              <Text style={{
                color: '#9AA4B2',
                fontSize: 13,
                marginTop: 4
              }}>
                Start logging workouts to see your activity here
              </Text>
            </View>
          ) : (
            recentWorkouts.map((workout, index) => (
              <View key={workout.id} style={{
                backgroundColor: '#0f172a',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#1e293b',
                marginBottom: index < recentWorkouts.length - 1 ? 10 : 0
              }}>
                <Text style={{ color: '#E6EAF2', fontSize: 15 }}>
                  {workout.routine_id ? workout.routines?.name : 'Custom Workout'}
                </Text>
                <Text style={{
                  color: '#9AA4B2',
                  fontSize: 13,
                  marginTop: 4
                }}>
                  {new Date(workout.date).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
}
