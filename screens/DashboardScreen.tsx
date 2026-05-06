import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { supabase, signUpUser, signInUser, getCurrentUser } from '../services/supabase';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { StandardHeader } from '../components';
import { getMostTrainedMuscle } from '../utils/muscleUtils';

const formatWeight = (value: number) => `${value.toLocaleString()} kg`;

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [weeklyDaysCompleted, setWeeklyDaysCompleted] = useState(0);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);
  const [mostTrainedMuscle, setMostTrainedMuscle] = useState('None');
  const [recentRoutine, setRecentRoutine] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [mostTrained, setMostTrained] = useState("");

  // Import the working date logic from ProgressScreen
  const getCurrentDayLabel = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Convert to Monday=0, Sunday=6
    return days[adjustedToday];
  };

  // Standardized date parsing function - use timestamp as primary source
  const parseWorkoutDate = (dateValue: any) => {
    if (!dateValue) return null;
    
    // If timestamp (number), use directly
    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    
    // If ISO string, create date object
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date;
    }
    
    return null;
  };

  // Standardized date comparison function
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  
  // Helper function to get weekly workout data
  const getWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    // Debug: Show current week boundaries
    const currentDayIndex = currentDate.getDay();
    const mondayOffset = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    console.log(`Current week: ${startOfWeek.toDateString()} to ${endOfWeek.toDateString()}`);
    console.log(`Today: ${currentDate.toDateString()} (Day ${currentDayIndex})`);
    console.log(`All workouts:`, workouts ? workouts.map(w => ({ id: w.id, date: w.date, parsed: parseWorkoutDate(w.date)?.toDateString() })) : 'No workouts data');
    
    const weeklyData = days.map((day, index) => {
      // Create date for each day of the week using standardized parsing
      const dayDate = new Date(today);
      const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Calculate the date for this day (Monday = 0, Tuesday = 1, etc.)
      const mondayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1; // Convert to Monday=0
      const daysFromMonday = index - mondayIndex;
      dayDate.setDate(today.getDate() + daysFromMonday);
      
      // Count workouts for this day using timestamp field directly
      const dayWorkouts = workouts.filter((workout: any) => {
        const workoutTimestamp = workout.timestamp;
        if (!workoutTimestamp) return false;
        
        // Create date from timestamp directly
        const workoutDate = new Date(Number(workoutTimestamp));
        
        // Use the same date logic as HistoryScreen - compare using toDateString
        const workoutDayString = workoutDate.toDateString();
        const targetDayString = dayDate.toDateString();
        const sameDay = workoutDayString === targetDayString;
        
        // Only include workouts from current week (Monday-Sunday)
        const startOfWeek = new Date(currentDate);
        const currentDayIndex = currentDate.getDay();
        const mondayOffset = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
        startOfWeek.setDate(currentDate.getDate() + mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const inWeekRange = workoutDate >= startOfWeek && workoutDate <= endOfWeek;
        
        if (inWeekRange && sameDay) {
          console.log(`Found workout for ${day}:`);
          console.log(`  - Original date: ${workout.date}`);
          console.log(`  - Parsed date: ${workoutDate.toDateString()}`);
          console.log(`  - Local string: ${workoutDate.toLocaleString()}`);
          console.log(`  - Target day: ${dayDate.toDateString()}`);
          console.log(`  - Same day: ${sameDay}`);
          console.log(`  - ID: ${workout.id}, Entries: ${workout.workout_entries ? workout.workout_entries.length : 0}`);
        }
        
        // Only count workouts that have actual entries (sets/reps)
        const hasEntries = workout.workout_entries && Array.isArray(workout.workout_entries) && workout.workout_entries.length > 0;
        return inWeekRange && sameDay && hasEntries;
      });
      
      // Fix tick mark logic - use simple direct comparison
      const currentDayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      const isToday = (currentDayOfWeek === 1 && index === 0) || // Monday
                     (currentDayOfWeek === 2 && index === 1) || // Tuesday
                     (currentDayOfWeek === 3 && index === 2) || // Wednesday
                     (currentDayOfWeek === 4 && index === 3) || // Thursday
                     (currentDayOfWeek === 5 && index === 4) || // Friday
                     (currentDayOfWeek === 6 && index === 5) || // Saturday
                     (currentDayOfWeek === 0 && index === 6);    // Sunday
      
      console.log(`Day ${day}: Index=${index}, Today=${currentDayOfWeek}, IsToday=${isToday}`);
      
      return {
        day,
        count: dayWorkouts.length,
        isToday: isToday
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

      // Fetch weekly workouts count and unique days
      const startOfWeek = getStartOfWeek();
      const { data: weeklyWorkoutsData, error: weeklyError } = await supabase
        .from('workouts')
        .select('date')
        .gte('date', startOfWeek);

      if (weeklyError) {
        console.error('Error fetching weekly workouts:', weeklyError);
        setWeeklyWorkouts(0);
        setWeeklyDaysCompleted(0);
      } else {
        // Count total sessions
        const totalSessions = weeklyWorkoutsData?.length || 0;
        setWeeklyWorkouts(totalSessions);
        
        // Count unique days
        const uniqueDays = new Set();
        weeklyWorkoutsData?.forEach(workout => {
          if (workout.date) {
            const workoutDate = new Date(workout.date).toDateString();
            uniqueDays.add(workoutDate);
          }
        });
        setWeeklyDaysCompleted(uniqueDays.size);
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
      // Update current date when screen focuses
      setCurrentDate(new Date());
      fetchDashboardData();
      
      // Smart Dashboard Logic - refresh on focus
      const fetchSmartData = async () => {
        const user = await getCurrentUser();

        if (!user) return;

        // fetch workouts with entries
        const { data: workoutsData } = await supabase
          .from('workouts')
          .select(`
            *,
            workout_entries (
              id,
              exercise_id,
              reps,
              weight
            )
          `)
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

        <StandardHeader title="Home" />

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
            {currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
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
                color: theme.colors.subtext,
                fontSize: 12,
                textTransform: 'uppercase',
                fontWeight: '500'
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
                    backgroundColor: (day.count > 0 || day.isToday) ? theme.colors.primary : theme.colors.border,
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
              {weeklyDaysCompleted} out of 7 days completed
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
                  {currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })}
                </Text>
              </View>
            ))
          )}
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
}
