import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { LineChart, BarChart } from 'react-native-chart-kit';
import RNPickerSelect from 'react-native-picker-select';

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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
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
    marginBottom: 16,
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
    marginBottom: 20,
  },
  measurementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  measurementLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
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
    marginBottom: 20,
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
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  prLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
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
  // Chart styles
  exerciseSelector: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  exerciseChip: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedExerciseChip: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  exerciseChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedExerciseChipText: {
    color: '#ffffff',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  insufficientDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  insufficientDataIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  insufficientDataIconText: {
    fontSize: 24,
  },
  insufficientDataTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  insufficientDataMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  insufficientDataTips: {
    alignItems: 'flex-start',
    width: '100%',
  },
  insufficientDataTip: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  // Workout Overview styles
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  overviewStat: {
    alignItems: 'center',
    flex: 1,
  },
  overviewStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  overviewStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  mostUsedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  overviewSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  mostUsedExercise: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  recentExercisesContainer: {
    marginTop: 20,
  },
  recentExercisesList: {
    gap: 8,
  },
  recentExerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  recentExerciseMuscle: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  // Custom Dropdown styles
  customDropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopColor: '#d1d5db',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  // Progress Summary styles
  progressSummaryContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressSummaryLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressSummaryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3b82f6',
  },
  // Exercise Picker styles
  exerciseSelectorBlock: {
    marginBottom: 24,
  },
  pickerContainer: {
    marginTop: 12,
  },
  // New UI styles for improved layout
  sectionContainer: {
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
});

export default function ProgressScreen() {
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [muscleGroupFrequency, setMuscleGroupFrequency] = useState<{[key: string]: number}>({});
  const [trend, setTrend] = useState('No recent increase');
  const [totalWorkoutsThisWeek, setTotalWorkoutsThisWeek] = useState(0);
  const [mostTrainedMuscleGroup, setMostTrainedMuscleGroup] = useState('None');
  const [highestWeightLifted, setHighestWeightLifted] = useState('');
  const [averageRepsPerWorkout, setAverageRepsPerWorkout] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<any[]>([]);
  const [userExercises, setUserExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [weightProgressionData, setWeightProgressionData] = useState<any[]>([]);
  const [weeklyVolumeData, setWeeklyVolumeData] = useState<any[]>([]);
    const [totalSessions, setTotalSessions] = useState(0);
    const [mostUsedExercise, setMostUsedExercise] = useState('');
    const [recentExercises, setRecentExercises] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const screenWidth = Dimensions.get('window').width;

  useFocusEffect(
    React.useCallback(() => {
      fetchProgressData();
    }, [])
  );

  const fetchProgressData = async () => {
    try {
      // Fetch all data with proper joins
      const { data: entriesData, error: entriesError } = await supabase
        .from('workout_entries')
        .select(`
          *,
          exercises!inner(
            id,
            name,
            muscle_group
          ),
          workouts!inner(
            id,
            created_at
          )
        `);

      if (entriesError) {
        console.error('Error fetching data:', entriesError);
        setLoading(false);
        return;
      }

      // Extract unique exercises the user has actually logged
      console.log('Raw entries data:', entriesData);
      
      const loggedExercises = entriesData?.map(entry => entry.exercises).filter((ex, index, arr) => 
        arr.findIndex(item => item.id === ex.id) === index
      ) || [];
      
      console.log('Extracted unique exercises:', loggedExercises);

      // Find most recently used exercise
      const mostRecentEntry = entriesData?.reduce((mostRecent, entry) => {
        const entryDate = new Date(entry.workouts.created_at);
        const mostRecentDate = mostRecent ? new Date(mostRecent.workouts.created_at) : new Date(0);
        return entryDate > mostRecentDate ? entry : mostRecent;
      }, null);

      const mostRecentExerciseId = mostRecentEntry?.exercises?.id || '';
      const mostRecentExercise = loggedExercises.find(ex => ex.id === mostRecentExerciseId);

      // Set exercises for selection
      setUserExercises(loggedExercises);
      setExercises(loggedExercises);

      // Calculate overview statistics
      const totalSessionsCount = entriesData?.length || 0;
      setTotalSessions(totalSessionsCount);

      // Find most used exercise (by frequency)
      const exerciseFrequency: {[key: string]: number} = {};
      entriesData?.forEach(entry => {
        if (entry.exercises && entry.exercises.name) {
          exerciseFrequency[entry.exercises.name] = (exerciseFrequency[entry.exercises.name] || 0) + 1;
        }
      });
      
      const mostUsed = Object.entries(exerciseFrequency).reduce((max, [name, count]) => 
        count > max.count ? { name, count } : max, { name: '', count: 0 }
      );
      setMostUsedExercise(mostUsed.name);

      // Get recent exercises (last 5 unique exercises)
      const recentEx = entriesData?.slice(-10).map(entry => entry.exercises).filter((ex, index, arr) => 
        arr.findIndex(item => item.id === ex.id) === index
      ).reverse() || [];
      setRecentExercises(recentEx);

      // Set default to most recently used exercise
      if (mostRecentExerciseId && !selectedExercise) {
        setSelectedExercise(mostRecentExerciseId);
        fetchWeightProgression(mostRecentExerciseId);
      }

      // Calculate weekly volume (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      console.log('Seven days ago date:', sevenDaysAgo);
      console.log('Fourteen days ago date:', fourteenDaysAgo);

      // Filter entries for last 7 days using proper date parsing
      const weeklyEntries = entriesData?.filter(entry => {
        const workoutDate = new Date(entry.workouts.created_at);
        return workoutDate >= sevenDaysAgo;
      }) || [];

      // Filter entries for previous week (7-14 days ago)
      const previousWeekEntries = entriesData?.filter(entry => {
        const workoutDate = new Date(entry.workouts.created_at);
        return workoutDate >= fourteenDaysAgo && workoutDate < sevenDaysAgo;
      }) || [];

      console.log('Weekly entries (last 7 days):', weeklyEntries.length);
      console.log('Previous week entries (7-14 days ago):', previousWeekEntries.length);

      // Calculate total weekly volume
      const totalWeeklyVolume = weeklyEntries.reduce((sum, entry) => {
        const entryVolume = entry.sets * entry.reps * entry.weight;
        console.log(`Entry volume: ${entry.sets} × ${entry.reps} × ${entry.weight} = ${entryVolume}`);
        return sum + entryVolume;
      }, 0);
      
      console.log('Total weekly volume:', totalWeeklyVolume);

      // Calculate previous week volume
      const previousWeekVolume = previousWeekEntries.reduce((sum, entry) => {
        const entryVolume = entry.sets * entry.reps * entry.weight;
        console.log(`Previous entry volume: ${entry.sets} × ${entry.reps} × ${entry.weight} = ${entryVolume}`);
        return sum + entryVolume;
      }, 0);

      console.log('Previous week total volume:', previousWeekVolume);

      // Calculate muscle group frequency using joined data
      const muscleFrequency: {[key: string]: number} = {};
      weeklyEntries.forEach(entry => {
        if (entry.exercises && entry.exercises.muscle_group) {
          muscleFrequency[entry.exercises.muscle_group] = (muscleFrequency[entry.exercises.muscle_group] || 0) + 1;
        }
      });

      // Calculate trend message with meaningful comparisons
      let trendMessage = 'No recent data';
      if (previousWeekVolume === 0 && totalWeeklyVolume > 0) {
        trendMessage = "Log more workouts this week to see your progress trend! 📊";
      } else if (previousWeekVolume === 0 && totalWeeklyVolume === 0) {
        trendMessage = "Start logging workouts to track your progress! 💪";
      } else if (totalWeeklyVolume > previousWeekVolume * 1.5) {
        const improvement = Math.round(((totalWeeklyVolume - previousWeekVolume) / previousWeekVolume) * 100);
        trendMessage = `Amazing! ${improvement}% increase from last week! 🔥`;
      } else if (totalWeeklyVolume > previousWeekVolume * 1.2) {
        const improvement = Math.round(((totalWeeklyVolume - previousWeekVolume) / previousWeekVolume) * 100);
        trendMessage = `Great progress! ${improvement}% increase from last week! 📈`;
      } else if (totalWeeklyVolume > previousWeekVolume) {
        const improvement = Math.round(((totalWeeklyVolume - previousWeekVolume) / previousWeekVolume) * 100);
        trendMessage = `Good work! ${improvement}% increase from last week! 👍`;
      } else if (totalWeeklyVolume < previousWeekVolume * 0.8) {
        const decline = Math.round(((previousWeekVolume - totalWeeklyVolume) / previousWeekVolume) * 100);
        trendMessage = `Down ${decline}% from last week. Time to bounce back! 💪`;
      } else if (totalWeeklyVolume < previousWeekVolume) {
        const decline = Math.round(((previousWeekVolume - totalWeeklyVolume) / previousWeekVolume) * 100);
        trendMessage = `${decline}% less than last week. Keep pushing! 🏋️`;
      } else {
        trendMessage = "Consistent effort! Maintain this momentum! ⚖️";
      }

      console.log('Trend comparison:', { current: totalWeeklyVolume, previous: previousWeekVolume, message: trendMessage });

      // Calculate unique workouts this week
      const uniqueWorkoutIds = new Set(weeklyEntries.map(entry => entry.workout_id));
      const totalWorkoutsThisWeek = uniqueWorkoutIds.size;

      console.log('=== WORKOUT COUNT DEBUG ===');
      console.log('Weekly entries count:', weeklyEntries.length);
      console.log('Unique workout IDs:', Array.from(uniqueWorkoutIds));
      console.log('Total workouts this week (unique sessions):', totalWorkoutsThisWeek);
      console.log('========================');

      // Find most trained muscle group
      const mostTrained = Object.entries(muscleFrequency).reduce((max, [muscle, count]) => 
        count > max.count ? { muscle, count } : max, { muscle: 'None', count: 0 }
      );
      console.log('Most trained muscle group:', mostTrained);

      // Calculate highest weight lifted (PR) with exercise details using joined data
      const highestWeightEntry = entriesData?.reduce((max, entry) => 
        entry.weight > max.weight ? entry : max, { weight: 0, exercises: null }
      );
      console.log('Highest weight entry:', highestWeightEntry);

      // Get exercise details for the PR using joined data
      const prDisplay = highestWeightEntry.exercises 
        ? `${highestWeightEntry.exercises.name} — ${highestWeightEntry.weight}kg (${highestWeightEntry.exercises.muscle_group || 'Unknown'})`
        : 'No PR data';
      console.log('PR display:', prDisplay);

      // Calculate average reps per workout
      const totalReps = weeklyEntries.reduce((sum, entry) => sum + entry.reps, 0);
      const avgReps = totalWorkoutsThisWeek > 0 ? Math.round(totalReps / totalWorkoutsThisWeek) : 0;
      console.log('Average reps per workout:', avgReps);

      // Calculate weekly volume per muscle group for bar chart using joined data
      const muscleGroupVolume: {[key: string]: number} = {};
      weeklyEntries.forEach(entry => {
        if (entry.exercises && entry.exercises.muscle_group) {
          const volume = entry.sets * entry.reps * entry.weight;
          muscleGroupVolume[entry.exercises.muscle_group] = (muscleGroupVolume[entry.exercises.muscle_group] || 0) + volume;
        }
      });

      // Format data for bar chart
      const volumeChartData = Object.entries(muscleGroupVolume).map(([muscle, volume]) => ({
        muscle,
        volume,
        formattedVolume: (volume / 1000).toFixed(1) // Convert to tons for readability
      }));

      setWeeklyVolume(totalWeeklyVolume);
      setMuscleGroupFrequency(muscleFrequency);
      setTrend(trendMessage);
      setTotalWorkoutsThisWeek(totalWorkoutsThisWeek);
      setMostTrainedMuscleGroup(mostTrained.muscle);
      setHighestWeightLifted(prDisplay);
      setAverageRepsPerWorkout(avgReps);
      setWeeklyVolumeData(volumeChartData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weight progression data for selected exercise
  const fetchWeightProgression = useCallback(async (exerciseId: string) => {
    try {
      console.log('Fetching progression for exercise:', exerciseId);
      
      // Fetch ALL workout entries for this specific exercise with joins
      const { data: entriesData, error: entriesError } = await supabase
        .from('workout_entries')
        .select(`
          *,
          exercises!inner(
            id,
            name,
            muscle_group
          ),
          workouts!inner(
            id,
            created_at
          )
        `)
        .eq('exercise_id', exerciseId)
        .order('workouts(created_at)', { ascending: true });

      if (entriesError) {
        console.error('Error fetching progression data:', entriesError);
        return;
      }

      console.log('Raw progression entries:', entriesData?.length, 'entries');

      // Group by date and take MAX weight per day
      const dateWeightMap = new Map();

      entriesData?.forEach(entry => {
        if (entry.workouts && entry.workouts.created_at) {
          // Parse date correctly without timezone issues
          const workoutDate = new Date(entry.workouts.created_at);
          const dateString = workoutDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          // Keep only the highest weight for each date
          if (!dateWeightMap.has(dateString) || entry.weight > dateWeightMap.get(dateString).weight) {
            dateWeightMap.set(dateString, {
              date: dateString,
              weight: entry.weight,
              reps: entry.reps,
              sets: entry.sets,
              fullDate: workoutDate
            });
          }
        }
      });

      // Convert to array and sort by date ascending
      const chartData = Array.from(dateWeightMap.values())
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
        .map(item => ({
          date: item.date,
          weight: item.weight,
          reps: item.reps,
          sets: item.sets
        }));

      console.log('Final chart data:', chartData);
      setWeightProgressionData(chartData);
    } catch (error) {
      console.error('Error fetching weight progression:', error);
    }
  }, []);

  // Handle exercise selection
  const handleExerciseSelect = useCallback((exerciseId: string) => {
    setSelectedExercise(exerciseId);
    fetchWeightProgression(exerciseId);
  }, [fetchWeightProgression]);

  // Memoized chart data
  const lineChartData = useMemo(() => {
    if (weightProgressionData.length === 0) return null;

    // Simple format for dates
    const formattedDates = weightProgressionData.map(item => item.date);
    
    return {
      labels: formattedDates,
      datasets: [{
        data: weightProgressionData.map(item => item.weight),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
        pointRadius: 6,
      }]
    };
  }, [weightProgressionData]);

  // Check if we have enough data for meaningful progression
  const hasEnoughProgressionData = weightProgressionData.length >= 2;

  const barChartData = useMemo(() => {
    if (weeklyVolumeData.length === 0) return null;

    return {
      labels: weeklyVolumeData.map(item => item.muscle),
      datasets: [{
        data: weeklyVolumeData.map(item => parseFloat(item.formattedVolume))
      }]
    };
  }, [weeklyVolumeData]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track your fitness journey</Text>
        </View>

        {/* Weekly Volume Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Weekly Volume</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.volumeNumber}>
              {loading ? 'Loading...' : weeklyVolume.toLocaleString()}
            </Text>
            <Text style={styles.volumeLabel}>Total kg lifted</Text>
          </View>
        </View>

        {/* Workout Overview Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Workout Overview</Text>
          <View style={styles.overviewCard}>
            {/* Summary Stats */}
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>
                  {loading ? '...' : userExercises.length}
                </Text>
                <Text style={styles.overviewStatLabel}>Exercises Trained</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>
                  {loading ? '...' : totalSessions}
                </Text>
                <Text style={styles.overviewStatLabel}>Total Sessions</Text>
              </View>
            </View>
            
            {/* Most Used Exercise */}
            <View style={styles.mostUsedContainer}>
              <Text style={styles.overviewSubTitle}>Most Used Exercise</Text>
              <Text style={styles.mostUsedExercise}>
                {loading ? 'Loading...' : mostUsedExercise || 'None'}
              </Text>
            </View>
            
            {/* Recent Exercises */}
            <View style={styles.recentExercisesContainer}>
              <Text style={styles.overviewSubTitle}>Recent Exercises</Text>
              <View style={styles.recentExercisesList}>
                {recentExercises.slice(0, 5).map((exercise, index) => (
                  <View key={exercise.id} style={styles.recentExerciseItem}>
                    <Text style={styles.recentExerciseName}>{exercise.name}</Text>
                    <Text style={styles.recentExerciseMuscle}>{exercise.muscle_group}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Charts</Text>
        
        {/* Exercise Selector */}
        <View style={styles.exerciseSelectorBlock}>
          <Text style={styles.selectorLabel}>Select Exercise:</Text>
          <View style={styles.customDropdownContainer}>
            {/* Selected Exercise Display */}
            <TouchableOpacity 
              style={styles.dropdownInput}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={styles.dropdownText}>
                {selectedExercise 
                  ? userExercises.find(ex => ex.id === selectedExercise)?.name || 'Select an exercise'
                  : 'Select an exercise'
                }
              </Text>
              <Text style={styles.dropdownArrow}>
                {showDropdown ? '↑' : '↓'}
              </Text>
            </TouchableOpacity>
            
            {/* Dropdown List */}
            {showDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={false}>
                  {userExercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedExercise(exercise.id);
                        setShowDropdown(false);
                        fetchWeightProgression(exercise.id);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{exercise.name}</Text>
                      <Text style={styles.dropdownItemSubtext}>{exercise.muscle_group}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
        
        {/* Weight Progression Chart */}
        {selectedExercise && lineChartData ? (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {exercises.find(ex => ex.id === selectedExercise)?.name} Progress
            </Text>
            {hasEnoughProgressionData ? (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Weight Progress</Text>
                <LineChart
                  data={lineChartData}
                  width={screenWidth - 60}
                  height={180}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: '#3b82f6'
                    }
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            ) : null}
            
            {/* Progress Summary Below Chart */}
            {hasEnoughProgressionData && (
              <View style={styles.progressSummaryContainer}>
                <View style={styles.progressSummaryRow}>
                  <Text style={styles.progressSummaryLabel}>Latest:</Text>
                  <Text style={styles.progressSummaryValue}>
                    {weightProgressionData[weightProgressionData.length - 1].weight}kg
                  </Text>
                </View>
                <View style={styles.progressSummaryRow}>
                  <Text style={styles.progressSummaryLabel}>Progress:</Text>
                  <Text style={styles.progressSummaryValue}>
                    +{weightProgressionData[weightProgressionData.length - 1].weight - weightProgressionData[0].weight}kg
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.chartCard}>
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                {selectedExercise ? 'No progression data available' : 'Select an exercise to view progress'}
              </Text>
            </View>
          </View>
        )}
        
        {/* Weekly Volume Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Muscle Group Volume</Text>
          {barChartData ? (
            <View style={styles.chartContainer}>
              <BarChart
                data={barChartData}
                width={screenWidth - 60}
                height={180}
                yAxisLabel=""
                yAxisSuffix="t"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  }
                }}
                style={styles.chart}
              />
              <Text style={styles.chartSubtitle}>Volume (tons)</Text>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No volume data available</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Stats</Text>
        
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

        <View style={styles.sectionCard}>
          <Text style={styles.chartSectionTitle}>Personal Record</Text>
          <Text style={styles.prNumber}>
            {loading ? 'Loading...' : highestWeightLifted}
          </Text>
        </View>

        <View style={[styles.sectionCard, { marginTop: 16 }]}>
          <Text style={styles.chartSectionTitle}>Most Trained</Text>
          <View style={styles.mostTrainedContainer}>
            <Text style={styles.mostTrainedLabel}>Muscle Group</Text>
            <Text style={styles.mostTrainedValue}>
              {loading ? 'Loading...' : mostTrainedMuscleGroup}
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { marginTop: 16 }]}>
          <Text style={styles.chartSectionTitle}>Trend</Text>
          <Text style={styles.trendText}>
            {loading ? 'Loading...' : trend}
          </Text>
        </View>
      </View>
    </ScrollView>
  </View>
);
}
