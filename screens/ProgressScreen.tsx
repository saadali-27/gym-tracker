import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { theme } from '../theme';
import { LineChart, BarChart } from 'react-native-chart-kit';
import RNPickerSelect from 'react-native-picker-select';

const formatWeight = (value: number) => `${value.toLocaleString()}`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 16,
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
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
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
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: theme.radius.md,
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
    color: theme.colors.subtext,
    marginBottom: 8,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  volumeNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  volumeLabel: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  muscleGroupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  muscleGroupName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  muscleGroupCount: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginLeft: 8,
  },
  trendText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: theme.radius.md,
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
    color: theme.colors.primary,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  prLabel: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 8,
  },
  prNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.accent,
    textAlign: 'center',
    marginBottom: 4,
  },
  prExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  prDate: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  barTooltip: {
    position: 'absolute',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  barTooltipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  barTooltipValue: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  mostTrainedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 4,
  },
  mostTrainedLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.subtext,
  },
  mostTrainedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  // Chart styles
  exerciseSelector: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
  exerciseChip: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedExerciseChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  exerciseChipText: {
    fontSize: 14,
    color: theme.colors.text,
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
    color: theme.colors.text,
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
    borderTopColor: theme.colors.border,
  },
  legendText: {
    fontSize: 14,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  chartSubtitle: {
    fontSize: 12,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors.subtext,
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
    backgroundColor: theme.colors.border,
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
    color: theme.colors.text,
    marginBottom: 8,
  },
  insufficientDataMessage: {
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  insufficientDataTips: {
    alignItems: 'flex-start',
    width: '100%',
  },
  insufficientDataTip: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 4,
  },
  // Workout Overview styles
  overviewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
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
    color: theme.colors.primary,
    marginBottom: 4,
  },
  overviewStatLabel: {
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  mostUsedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  overviewSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  mostUsedExercise: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.accent,
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
    backgroundColor: theme.colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    color: theme.colors.text,
    flex: 1,
  },
  recentExerciseMuscle: {
    fontSize: 13,
    color: theme.colors.subtext,
    fontWeight: '500',
    backgroundColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
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
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginLeft: 8,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopColor: theme.colors.border,
    borderRadius: theme.radius.sm,
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
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginLeft: 8,
  },
  // Progress Summary styles
  progressSummaryContainer: {
    backgroundColor: theme.colors.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: theme.radius.sm,
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
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  progressSummaryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
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
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
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
    color: theme.colors.text,
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
  const [stats, setStats] = useState({ totalVolume: 0, totalReps: 0, totalSets: 0 });
  const [muscleGroupVolume, setMuscleGroupVolume] = useState<{[key: string]: number}>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [entriesData, setEntriesData] = useState<any[]>([]);
  const [selectedBar, setSelectedBar] = useState<{ label: string; value: number } | null>(null);
  const screenWidth = Dimensions.get('window').width;

  useFocusEffect(
    React.useCallback(() => {
      fetchProgressData();
    }, [])
  );

  const fetchProgressData = async () => {
    try {
      // Fetch ALL workout_entries joined with workouts
      const { data: entriesData, error: entriesError } = await supabase
        .from('workout_entries')
        .select(`
          id,
          exercise_id,
          reps,
          weight,
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

      // Helper function to get start of week
      const getStartOfWeek = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day;
        const start = new Date(now.setDate(diff));
        start.setHours(0,0,0,0);
        return start;
      };

      console.log('Raw entries data:', entriesData);
      
      // Set entriesData for PR calculation
      setEntriesData(entriesData || []);

      // Helper to safely access nested data
      const getExerciseData = (entry: any) => Array.isArray(entry.exercises) ? entry.exercises[0] : entry.exercises;
      const getWorkoutData = (entry: any) => Array.isArray(entry.workouts) ? entry.workouts[0] : entry.workouts;

      // WEEKLY VOLUME (FIX)
      const weeklyVolume = entriesData
        ?.filter(e => {
          const workout = getWorkoutData(e);
          return workout && new Date(workout.created_at) >= getStartOfWeek();
        })
        ?.reduce((sum, e) => sum + (e.weight * e.reps), 0) || 0;

      // ALL TIME VOLUME
      const totalVolume = entriesData?.reduce((sum, e) => sum + (e.weight * e.reps), 0) || 0;

      // EXERCISES TRAINED
      const uniqueExercises = new Set(
        entriesData?.map(e => {
          const exercise = getExerciseData(e);
          return exercise?.name;
        }).filter(Boolean)
      ).size;

      // TOTAL SESSIONS
      const sessions = new Set(
        entriesData?.map(e => {
          const workout = getWorkoutData(e);
          return workout?.created_at;
        }).filter(Boolean)
      ).size;

      // MOST USED EXERCISE
      const freq: { [key: string]: number } = {};
      entriesData?.forEach(e => {
        const exercise = getExerciseData(e);
        const exerciseName = exercise?.name;
        if (exerciseName) {
          freq[exerciseName] = (freq[exerciseName] || 0) + 1;
        }
      });
      const mostUsed = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b, '');

      // MUSCLE GROUP VOLUME (FIX)
      const muscleMap: { [key: string]: string } = {
        "Bench Press": "Chest",
        "Chest Fly": "Chest",
        "Incline Bench": "Chest",
        "Decline Bench": "Chest",
        "Pull Ups": "Back",
        "Barbell Row": "Back",
        "Deadlift": "Back",
        "Lat Pulldown": "Back",
        "Squat": "Legs",
        "Leg Press": "Legs",
        "Leg Curl": "Legs",
        "Leg Extension": "Legs",
        "Shoulder Press": "Shoulders",
        "Lateral Raise": "Shoulders",
        "Front Raise": "Shoulders",
        "Bicep Curl": "Arms",
        "Tricep Extension": "Arms",
        "Hammer Curl": "Arms"
      };

      const muscleVolume: { [key: string]: number } = {};
      entriesData?.forEach(e => {
        const exercise = getExerciseData(e);
        const exerciseName = exercise?.name;
        if (exerciseName) {
          const group = muscleMap[exerciseName] || "Other";
          const vol = e.weight * e.reps;
          muscleVolume[group] = (muscleVolume[group] || 0) + vol;
        }
      });

      // Extract unique exercises for selection
      const loggedExercises: any[] = [];
      const exerciseIds = new Set();
      entriesData?.forEach(e => {
        const exercise = getExerciseData(e);
        if (exercise && !exerciseIds.has(exercise.id)) {
          exerciseIds.add(exercise.id);
          loggedExercises.push(exercise);
        }
      });

      // Find most recently used exercise
      let mostRecentEntry: any = null;
      entriesData?.forEach(entry => {
        const workout = getWorkoutData(entry);
        if (workout) {
          const entryDate = new Date(workout.created_at);
          if (!mostRecentEntry || entryDate > new Date(getWorkoutData(mostRecentEntry).created_at)) {
            mostRecentEntry = entry;
          }
        }
      });

      const mostRecentExerciseId = getExerciseData(mostRecentEntry)?.id || '';
      const mostRecentExercise = loggedExercises.find(ex => ex.id === mostRecentExerciseId);

      // Set exercises for selection
      setUserExercises(loggedExercises);
      setExercises(loggedExercises);

      // Set stats
      setStats({
        totalVolume,
        totalReps: entriesData?.reduce((sum, e) => sum + e.reps, 0) || 0,
        totalSets: entriesData?.length || 0
      });

      // Set muscle group volume
      setMuscleGroupVolume(muscleVolume);

      // Prepare data for weight progress chart
      const exerciseData = entriesData?.filter(e => {
        const exercise = getExerciseData(e);
        return exercise?.name === selectedExercise;
      });
      const chartData = exerciseData
        ?.sort((a, b) => {
          const workoutA = getWorkoutData(a);
          const workoutB = getWorkoutData(b);
          return new Date(workoutA.created_at).getTime() - new Date(workoutB.created_at).getTime();
        })
        ?.map(entry => {
          const workout = getWorkoutData(entry);
          return {
            date: new Date(workout.created_at).toLocaleDateString(),
            weight: entry.weight,
            reps: entry.reps
          };
        }) || [];

      setChartData(chartData);

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
        const workout = getWorkoutData(entry);
        return workout && new Date(workout.created_at) >= sevenDaysAgo;
      }) || [];

      // Filter entries for previous week (7-14 days ago)
      const previousWeekEntries = entriesData?.filter(entry => {
        const workout = getWorkoutData(entry);
        return workout && new Date(workout.created_at) >= fourteenDaysAgo && new Date(workout.created_at) < sevenDaysAgo;
      }) || [];

      console.log('Weekly entries (last 7 days):', weeklyEntries.length);
      console.log('Previous week entries (7-14 days ago):', previousWeekEntries.length);

      // Calculate total weekly volume (each entry is one set)
      const totalWeeklyVolume = weeklyEntries.reduce((sum, entry) => {
        const entryVolume = entry.reps * entry.weight;
        console.log(`Entry volume: ${entry.reps} × ${entry.weight} = ${entryVolume}`);
        return sum + entryVolume;
      }, 0);
      
      console.log('Total weekly volume:', totalWeeklyVolume);

      // Calculate previous week volume
      const previousWeekVolume = previousWeekEntries.reduce((sum, entry) => {
        const entryVolume = entry.reps * entry.weight;
        console.log(`Previous entry volume: ${entry.reps} × ${entry.weight} = ${entryVolume}`);
        return sum + entryVolume;
      }, 0);

      console.log('Previous week total volume:', previousWeekVolume);

      // Calculate muscle group frequency using joined data
      const muscleFrequency: {[key: string]: number} = {};
      weeklyEntries.forEach(entry => {
        const exercise = getExerciseData(entry);
        if (exercise && exercise.muscle_group) {
          muscleFrequency[exercise.muscle_group] = (muscleFrequency[exercise.muscle_group] || 0) + 1;
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
      const uniqueWorkoutIds = new Set(weeklyEntries.map(entry => {
        const workout = getWorkoutData(entry);
        return workout?.id;
      }).filter(Boolean));
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
      let highestWeightEntry: any = null;
      entriesData?.forEach(entry => {
        if (!highestWeightEntry || entry.weight > highestWeightEntry.weight) {
          highestWeightEntry = entry;
        }
      });
      console.log('Highest weight entry:', highestWeightEntry);

      // Get exercise details for the PR using joined data
      const prExercise = getExerciseData(highestWeightEntry);
      const prDisplay = prExercise 
        ? `${highestWeightEntry?.weight}kg`
        : 'No PR data';
      console.log('PR display:', prDisplay);

      // Calculate average reps per workout
      const totalReps = weeklyEntries.reduce((sum, entry) => sum + entry.reps, 0);
      const avgReps = totalWorkoutsThisWeek > 0 ? Math.round(totalReps / totalWorkoutsThisWeek) : 0;
      console.log('Average reps per workout:', avgReps);

      // Calculate weekly volume per muscle group for bar chart using joined data (last 7 days only)
      const muscleGroupVolumeChart: {[key: string]: number} = {};
      console.log('=== MUSCLE GROUP VOLUME DEBUG ===');
      console.log('Processing', weeklyEntries.length, 'weekly entries for volume calculation');
      
      weeklyEntries.forEach((entry, index) => {
        const exercise = getExerciseData(entry);
        if (exercise && exercise.muscle_group) {
          const volume = entry.reps * entry.weight; // volume per set = weight * reps
          console.log(`Entry ${index + 1}: ${exercise.name} (${exercise.muscle_group}) - ${entry.reps} × ${entry.weight} = ${volume}kg`);
          muscleGroupVolumeChart[exercise.muscle_group] = (muscleGroupVolumeChart[exercise.muscle_group] || 0) + volume;
        }
      });

      console.log('Final muscle group volume (last 7 days):', muscleGroupVolumeChart);
      console.log('====================================');

      // Sanity check for realistic values
      const sanityCheck = Object.entries(muscleGroupVolumeChart).map(([muscle, volume]) => {
        const isRealistic = volume <= 5000; // 5000kg per muscle group per week is extremely high
        if (!isRealistic) {
          console.warn(`⚠️ UNREALISTIC VOLUME DETECTED: ${muscle} = ${volume}kg (should be < 5000kg/week)`);
        }
        return { muscle, volume, realistic: isRealistic };
      });

      // Filter out any unrealistic values (optional - comment out if you want to see all data)
      const filteredVolumeChart = Object.fromEntries(
        sanityCheck.filter(item => item.realistic).map(item => [item.muscle, item.volume])
      );

      // Use filtered data for chart
      const finalVolumeData = Object.keys(filteredVolumeChart).length > 0 ? filteredVolumeChart : muscleGroupVolumeChart;

      console.log('Final volume data for chart:', finalVolumeData);

      // Format data for bar chart - keep in KG, no abbreviations
      const volumeChartData = Object.entries(finalVolumeData).map(([muscle, volume]) => ({
        muscle,
        volume,
        formattedVolume: volume.toFixed(0) // Keep as KG, no conversion to tons
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

  // Calculate Personal Record for selected exercise
  const calculatePersonalRecord = useCallback((exerciseId: string) => {
    if (!entriesData || entriesData.length === 0) return 0;
    
    const exerciseEntries = entriesData.filter((entry: any) => entry.exercise_id === exerciseId);
    if (exerciseEntries.length === 0) return 0;
    
    const maxWeight = Math.max(...exerciseEntries.map((entry: any) => entry.weight));
    return maxWeight;
  }, [entriesData]);

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

    // Get raw volumes
    const volumes = weeklyVolumeData.map(item => item.volume);
    const maxVolume = Math.max(...volumes);
    
    // Create clean Y-axis steps with realistic scaling
    const steps = 5;
    let stepValue;
    
    // Smart step calculation for realistic gym values
    if (maxVolume <= 100) {
      stepValue = 20; // 0, 20, 40, 60, 80, 100
    } else if (maxVolume <= 500) {
      stepValue = 100; // 0, 100, 200, 300, 400, 500
    } else if (maxVolume <= 1000) {
      stepValue = 200; // 0, 200, 400, 600, 800, 1000
    } else if (maxVolume <= 2000) {
      stepValue = 400; // 0, 400, 800, 1200, 1600, 2000
    } else {
      stepValue = Math.ceil(maxVolume / steps / 100) * 100; // Round to nearest 100
    }
    
    const yAxisMax = stepValue * steps;

    console.log('=== CHART SCALING DEBUG ===');
    console.log('Raw volumes:', volumes);
    console.log('Max volume:', maxVolume);
    console.log('Step value:', stepValue);
    console.log('Y-axis max:', yAxisMax);
    console.log('==========================');

    // Use actual volume values for chart data (let chart library handle scaling)
    return {
      labels: weeklyVolumeData.map(item => item.muscle),
      datasets: [{
        data: volumes
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
              {loading ? 'Loading...' : formatWeight(weeklyVolume)}
            </Text>
            <Text style={styles.volumeLabel}>Total kg lifted</Text>
          </View>
        </View>

        {/* Personal Record Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Record</Text>
          
          {/* Exercise Dropdown */}
          <View style={styles.exerciseSelectorBlock}>
            <Text style={styles.selectorLabel}>Select Exercise:</Text>
            <View style={styles.customDropdownContainer}>
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
          
          {/* PR Display */}
          {selectedExercise && (
            <View style={styles.card}>
              <Text style={styles.prExerciseName}>
                {userExercises.find(ex => ex.id === selectedExercise)?.name || 'Select an exercise'}
              </Text>
              <Text style={styles.prNumber}>
                {formatWeight(calculatePersonalRecord(selectedExercise))}
              </Text>
              <Text style={styles.prDate}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Charts Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Weight Progress</Text>
          
          {/* Weight Progression Chart */}
          {selectedExercise && lineChartData ? (
            <View style={styles.chartCard}>
              <LineChart
                data={lineChartData}
                width={screenWidth - 60}
                height={180}
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(79, 140, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(154, 164, 178, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: theme.colors.primary
                  }
                }}
                bezier
                style={styles.chart}
              />
              
              {/* Progress Summary Below Chart */}
              {hasEnoughProgressionData && (
                <View style={styles.progressSummaryContainer}>
                  <View style={styles.progressSummaryRow}>
                    <Text style={styles.progressSummaryLabel}>Latest:</Text>
                    <Text style={styles.progressSummaryValue}>
                      {formatWeight(weightProgressionData[weightProgressionData.length - 1].weight)} kg
                    </Text>
                  </View>
                  <View style={styles.progressSummaryRow}>
                    <Text style={styles.progressSummaryLabel}>Progress:</Text>
                    <Text style={styles.progressSummaryValue}>
                      +{formatWeight(weightProgressionData[weightProgressionData.length - 1].weight - weightProgressionData[0].weight)} kg
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
        </View>

        {/* Volume Progress Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Volume Progress</Text>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Muscle Group Volume</Text>
            {barChartData && barChartData.labels && barChartData.labels.length > 0 ? (
              <View style={styles.chartContainer}>
                <TouchableOpacity
                  onPress={(event) => {
                    // Calculate which bar was pressed based on touch position
                    const touchX = event.nativeEvent.locationX;
                    const chartWidth = screenWidth - 60;
                    const barWidth = chartWidth / barChartData.labels.length;
                    const barIndex = Math.floor(touchX / barWidth);
                    
                    if (barIndex >= 0 && barIndex < barChartData.labels.length) {
                      const label = barChartData.labels[barIndex];
                      const volumeData = weeklyVolumeData.find(item => item.muscle === label);
                      if (volumeData) {
                        setSelectedBar({ label, value: volumeData.volume });
                        // Hide tooltip after 2 seconds
                        setTimeout(() => setSelectedBar(null), 2000);
                      }
                    }
                  }}
                  style={{ position: 'relative' }}
                >
                  <BarChart
                    data={barChartData}
                    width={screenWidth - 60}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix="kg"
                    fromZero={true}
                    chartConfig={{
                      backgroundColor: theme.colors.card,
                      backgroundGradientFrom: theme.colors.card,
                      backgroundGradientTo: theme.colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: 'none'
                      },
                      propsForLabels: {
                        fontSize: 10,
                        fontWeight: '500'
                      }
                    }}
                    style={styles.chart}
                  />
                  
                  {/* Tooltip */}
                  {selectedBar && (
                    <View style={[
                      styles.barTooltip,
                      {
                        left: (screenWidth - 60) * (barChartData.labels.indexOf(selectedBar.label) + 0.5) / barChartData.labels.length - 50,
                        top: 20,
                      }
                    ]}>
                      <Text style={styles.barTooltipText}>{selectedBar.label}</Text>
                      <Text style={styles.barTooltipValue}>{formatWeight(selectedBar.value)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.chartSubtitle}>Volume (kg) - Last 7 Days</Text>
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
