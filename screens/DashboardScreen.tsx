import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
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

  // Helper function to get weekly workout data
  const getWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to get Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weeklyData = days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      
      // Count workouts for this day
      const dayWorkouts = workouts.filter((workout: any) => {
        const workoutDate = new Date(workout.date);
        return workoutDate.toDateString() === date.toDateString();
      });
      
      return {
        day,
        count: dayWorkouts.length,
        isToday: index === (currentDay === 0 ? 6 : currentDay - 1)
      };
    });
    
    return weeklyData;
  };

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
  let focusTitle = "Start a workout";
  let focusSub = "Build consistency";

  if (workouts.length > 0) {
    focusTitle = "Stay consistent";
    focusSub = "Keep pushing your progress";
  }

  // MICRO INSIGHT
  let insight = "";

  if (workouts.length === 0) {
    insight = "Start your fitness journey";
  } else if (workouts.length < 3) {
    insight = "You're building momentum";
  } else {
    insight = "Great consistency this week";
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >

        {/* Home Header */}
        <View style={{ 
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24
        }}>
          <Text style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: '500'
          }}>
            Home
          </Text>
        </View>
        
        {/* Subtle Separator */}
        <View style={{
          height: 1,
          backgroundColor: theme.colors.border,
          marginBottom: 24,
          marginHorizontal: 16
        }} />

        {/* Welcome Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            color: theme.colors.text,
            fontSize: 24,
            fontWeight: '600'
          }}>
            Welcome Back, Saad
          </Text>

          <Text style={{
            color: theme.colors.subtext,
            fontSize: 14,
            marginTop: 4,
            textTransform: 'uppercase'
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 24 }}>
          <View style={{
            flexDirection: 'row',
            gap: 12
          }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: theme.colors.card,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8
              }}
              onPress={() => navigation.navigate('Log' as never)}
            >
              <Text style={{ 
                color: theme.colors.text, 
                fontWeight: '600',
                fontSize: 16
              }}>
                +
              </Text>
              <Text style={{ 
                color: theme.colors.text, 
                fontWeight: '600',
                fontSize: 16
              }}>
                Start
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: theme.colors.card,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center'
              }}
              onPress={() => navigation.navigate('Routines' as never)}
            >
              <Text style={{ 
                color: theme.colors.text,
                fontWeight: '600',
                fontSize: 16
              }}>
                Routines
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Stats */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 16
          }}>
            THIS WEEK
          </Text>
          
          <View style={{
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Text style={{
                color: theme.colors.text,
                fontSize: 14
              }}>
                sessions
              </Text>
              <Text style={{
                color: theme.colors.primary,
                fontSize: 24,
                fontWeight: 'bold'
              }}>
                {weeklyWorkouts}
              </Text>
            </View>
            
            {/* Weekly Progress */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {getWeeklyData().map((day, index) => (
                <View key={index} style={{
                  alignItems: 'center',
                  flex: 1
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: day.count > 0 ? theme.colors.primary : theme.colors.border,
                    marginBottom: 4,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {day.count > 0 && (
                      <Text style={{
                        color: theme.colors.background,
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </Text>
                    )}
                  </View>
                  <Text style={{
                    color: theme.colors.subtext,
                    fontSize: 10,
                    textAlign: 'center'
                  }}>
                    {day.day}
                  </Text>
                </View>
              ))}
            </View>
            
            <Text style={{
              color: theme.colors.subtext,
              fontSize: 12,
              marginTop: 12,
              textAlign: 'center'
            }}>
              {weeklyWorkouts} out of 7 days completed
            </Text>
          </View>
        </View>

        {/* Recent Sessions */}
        <View>
          <Text style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 16
          }}>
            RECENT
          </Text>

          {loading ? (
            <View style={{
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}>
              <Text style={{ color: theme.colors.text, fontSize: 15 }}>
                Loading...
              </Text>
            </View>
          ) : recentWorkouts.length === 0 ? (
            <View style={{
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}>
              <Text style={{ color: theme.colors.text, fontSize: 15 }}>
                No sessions yet
              </Text>
              <Text style={{
                color: theme.colors.subtext,
                fontSize: 13,
                marginTop: 4
              }}>
                Start logging workouts to see your activity here
              </Text>
            </View>
          ) : (
            recentWorkouts.map((workout, index) => (
              <View key={workout.id} style={{
                backgroundColor: theme.colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: index < recentWorkouts.length - 1 ? 8 : 0
              }}>
                <Text style={{ color: theme.colors.text, fontSize: 15 }}>
                  {workout.routine_id ? workout.routines?.name : 'Custom Workout'}
                </Text>
                <Text style={{
                  color: theme.colors.subtext,
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
