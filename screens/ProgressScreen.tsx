import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import { theme } from '../theme';
import { LineChart, BarChart } from 'react-native-chart-kit';
import RNPickerSelect from 'react-native-picker-select';
import { getMostTrainedMuscle } from '../utils/muscleUtils';

const formatWeight = (value: number) => `${value.toLocaleString()}`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
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
    marginBottom: 24,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16, // spacing between cards
    borderWidth: 1,
    borderColor: '#1e293b',
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
    marginBottom: 24,
  },
  measurementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
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
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
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
    marginBottom: 10,
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
    marginVertical: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
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
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const [stats, setStats] = useState({ totalVolume: 0, totalReps: 0, totalSets: 0 });
  const [muscleGroupVolume, setMuscleGroupVolume] = useState<{[key: string]: number}>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [entriesData, setEntriesData] = useState<any[]>([]);
  const [selectedBar, setSelectedBar] = useState<{ label: string; value: number } | null>(null);
  const [fitnessInsights, setFitnessInsights] = useState('');
  const screenWidth = Dimensions.get('window').width;

  const openDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

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
        const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        const start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        return start;
      };

      console.log('Raw entries data:', entriesData);
      console.log('Total entries count:', entriesData?.length || 0);
      
      // Helper to safely access nested data
      const getExerciseData = (entry: any) => {
        if (!entry || !entry.exercises) return null;
        return Array.isArray(entry.exercises) ? entry.exercises[0] : entry.exercises;
      };
      const getWorkoutData = (entry: any) => {
        if (!entry || !entry.workouts) return null;
        return Array.isArray(entry.workouts) ? entry.workouts[0] : entry.workouts;
      };
      
      // Debug: Show all entry dates to understand the data
      if (entriesData && entriesData.length > 0) {
        console.log('=== ALL WORKOUT ENTRY DATES ===');
        entriesData.forEach((entry, index) => {
          const workout = getWorkoutData(entry);
          console.log(`Entry ${index + 1}: Date = ${workout?.created_at}, Parsed = ${workout ? new Date(workout.created_at) : 'No workout data'}`);
        });
      } else {
        console.log('No workout entries found in database');
      }
      
      // Set entriesData for PR calculation
      setEntriesData(entriesData || []);

      // Extract unique exercises for dropdown
      const loggedExercises: any[] = [];
      const exerciseIds = new Set();
      entriesData?.forEach(e => {
        const exercise = getExerciseData(e);
        if (exercise && exercise.id && !exerciseIds.has(exercise.id)) {
          exerciseIds.add(exercise.id);
          loggedExercises.push(exercise);
        }
      });

      // Set exercises for dropdown
      setUserExercises(loggedExercises);
      setExercises(loggedExercises);

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

      if (mostRecentExerciseId && !selectedExercise) {
        setSelectedExercise(mostRecentExerciseId);
        fetchWeightProgression(mostRecentExerciseId);
      }

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
        }).filter(name => name) // Filter out null/undefined names
      );

      // PREVIOUS WEEK VOLUME
      const getStartOfPreviousWeek = () => {
        const startOfCurrentWeek = getStartOfWeek();
        const startOfPreviousWeek = new Date(startOfCurrentWeek);
        startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);
        return startOfPreviousWeek;
      };

      const weeklyEntries = entriesData?.filter(e => {
        const workout = getWorkoutData(e);
        if (!workout || !workout.created_at) return false;
        const entryDate = new Date(workout.created_at);
        return workout && entryDate >= getStartOfWeek();
      }) || [];

      const previousWeekEntries = entriesData?.filter(e => {
        const workout = getWorkoutData(e);
        if (!workout || !workout.created_at) return false;
        const entryDate = new Date(workout.created_at);
        return workout && entryDate >= getStartOfPreviousWeek() && entryDate < getStartOfWeek();
      }) || [];

      console.log('Current week entries (Mon-Today):', weeklyEntries.length);
      console.log('Previous week entries (Last Mon-Sun):', previousWeekEntries.length);

      // Calculate total weekly volume (each entry is one set)
      const totalWeeklyVolume = weeklyEntries.reduce((sum, entry) => {
        if (!entry || entry.reps == null || entry.weight == null) return sum;
        const entryVolume = entry.reps * entry.weight;
        console.log(`Entry volume: ${entry.reps} × ${entry.weight} = ${entryVolume}`);
        return sum + entryVolume;
      }, 0);
      
      console.log('Total weekly volume:', totalWeeklyVolume);

      // Calculate previous week volume
      const previousWeekVolume = previousWeekEntries.reduce((sum, entry) => {
        if (!entry || entry.reps == null || entry.weight == null) return sum;
        const entryVolume = entry.reps * entry.weight;
        console.log(`Previous entry volume: ${entry.reps} × ${entry.weight} = ${entryVolume}`);
        return sum + entryVolume;
      }, 0);

      console.log('Previous week total volume:', previousWeekVolume);

      // Calculate professional fitness insights and recommendations
      let trendMessage = 'No recent data';
      let volumeChange = 0;
      let volumeChangePercent = 0;
      
      // Check if this is the first week of training
      const isFirstWeek = previousWeekVolume === 0;
      const hasCurrentWeekData = totalWeeklyVolume > 0;
      
      if (isFirstWeek && hasCurrentWeekData) {
        // First week insights - focus on achievement and encouragement
        if (totalWeeklyVolume >= 2000) {
          trendMessage = `🔥 Impressive first week! ${formatWeight(totalWeeklyVolume)} total volume. You started strong!`;
        } else if (totalWeeklyVolume >= 1000) {
          trendMessage = `💪 Great first week! ${formatWeight(totalWeeklyVolume)} total volume. Solid foundation!`;
        } else if (totalWeeklyVolume >= 500) {
          trendMessage = `👍 Good start! ${formatWeight(totalWeeklyVolume)} total volume. Keep building!`;
        } else {
          trendMessage = `🎯 First week logged! ${formatWeight(totalWeeklyVolume)} total volume. Every journey begins!`;
        }
      } else if (isFirstWeek && !hasCurrentWeekData) {
        trendMessage = "Ready to start your fitness journey? Log your first workout! 💪";
      } else {
        volumeChange = totalWeeklyVolume - previousWeekVolume;
        volumeChangePercent = Math.round((volumeChange / previousWeekVolume) * 100);
        
        // Professional fitness app insights with actionable recommendations
        if (volumeChangePercent >= 50) {
          trendMessage = `🔥 Outstanding! +${volumeChangePercent}% volume increase (${formatWeight(volumeChange)}kg). You're crushing it! Consider recovery this week.`;
        } else if (volumeChangePercent >= 25) {
          trendMessage = `📈 Excellent progress! +${volumeChangePercent}% volume increase (${formatWeight(volumeChange)}kg). Keep this intensity!`;
        } else if (volumeChangePercent >= 10) {
          trendMessage = `💪 Solid improvement! +${volumeChangePercent}% volume increase (${formatWeight(volumeChange)}kg). Great consistency!`;
        } else if (volumeChangePercent > 0) {
          trendMessage = `👍 Steady progress! +${volumeChangePercent}% volume increase (${formatWeight(volumeChange)}kg). Every rep counts!`;
        } else if (volumeChangePercent <= -30) {
          trendMessage = `⚠️ Significant drop: ${volumeChangePercent}% volume decrease (${formatWeight(Math.abs(volumeChange))}kg). Focus on consistency this week.`;
        } else if (volumeChangePercent <= -10) {
          trendMessage = `📉 Volume down ${Math.abs(volumeChangePercent)}% (${formatWeight(Math.abs(volumeChange))}kg). Time to get back on track!`;
        } else if (volumeChangePercent < 0) {
          trendMessage = `🔄 Slight decrease: ${volumeChangePercent}% volume (${formatWeight(Math.abs(volumeChange))}kg). Small adjustments needed!`;
        } else {
          trendMessage = `🗑️ Consistent volume at ${formatWeight(totalWeeklyVolume)}. Great stability! Try adding 5-10% next week.`;
        }
      }

      console.log('Trend comparison:', { current: totalWeeklyVolume, previous: previousWeekVolume, message: trendMessage });

      // Calculate unique workouts this week
      const uniqueWorkoutIds = new Set(weeklyEntries.map(entry => {
        const workout = getWorkoutData(entry);
        return workout?.id;
      }).filter(Boolean));
      const totalWorkoutsThisWeek = uniqueWorkoutIds.size;

      // Additional professional fitness insights
      const getFitnessInsights = () => {
        const insights = [];
        
        // Workout frequency analysis
        if (totalWorkoutsThisWeek >= 4) {
          insights.push("🏃 Excellent frequency! 4+ workouts this week shows great commitment.");
        } else if (totalWorkoutsThisWeek >= 3) {
          insights.push("💪 Good consistency! 3 workouts this week - keep it up!");
        } else if (totalWorkoutsThisWeek >= 2) {
          insights.push("👍 Solid start! 2 workouts this week. Aim for 3-4 for optimal results.");
        } else if (totalWorkoutsThisWeek === 1) {
          insights.push("🎯 One workout done! Add 1-2 more this week for better progress.");
        } else {
          insights.push("🚀 No workouts yet this week. Start with 2-3 sessions!");
        }

        // Volume intensity analysis
        const avgVolumePerWorkout = totalWeeklyVolume > 0 ? Math.round(totalWeeklyVolume / totalWorkoutsThisWeek) : 0;
        if (avgVolumePerWorkout > 2000) {
          insights.push("🔥 High intensity! Your average volume per workout is excellent.");
        } else if (avgVolumePerWorkout > 1000) {
          insights.push("💪 Good intensity! Solid volume per workout.");
        } else if (avgVolumePerWorkout > 0) {
          insights.push("📈 Building intensity! Consider increasing weight or reps gradually.");
        }

        // Muscle balance analysis (if we have multiple muscle groups)
        const muscleGroups = Object.keys({});
        if (muscleGroups.length >= 3) {
          insights.push("⚖️ Great muscle balance! Training multiple muscle groups.");
        } else if (muscleGroups.length === 2) {
          insights.push("🎯 Good focus! Consider adding more variety for balanced development.");
        } else if (muscleGroups.length === 1) {
          insights.push("💡 Focused training! Try adding exercises for other muscle groups.");
        }

        return insights.join(" ");
      };

      setFitnessInsights(getFitnessInsights());

      console.log('=== WORKOUT COUNT DEBUG ===');
      console.log('Weekly entries count:', weeklyEntries.length);
      console.log('Unique workout IDs:', Array.from(uniqueWorkoutIds));
      console.log('Total workouts this week (unique sessions):', totalWorkoutsThisWeek);
      console.log('========================');

      // Find most trained muscle group using volume
      const mostTrained = getMostTrainedMuscle(weeklyEntries || []);
      console.log('Most trained muscle group:', mostTrained);

      // Calculate highest weight lifted (PR) with exercise details using joined data
      let highestWeightEntry: any = null;
      entriesData?.forEach(entry => {
        if (!highestWeightEntry || entry.weight > highestWeightEntry.weight) {
          highestWeightEntry = entry;
        }
      });

      const exercise = highestWeightEntry ? getExerciseData(highestWeightEntry) : null;
      const prDisplay = exercise 
        ? `${highestWeightEntry.weight}kg (${exercise.name})`
        : highestWeightEntry 
        ? `${highestWeightEntry.weight}kg` 
        : 'None';

      // Calculate average reps per workout (unique sessions)
      const totalReps = weeklyEntries.reduce((sum, entry) => sum + (entry.reps || 0), 0);
      const avgReps = totalWorkoutsThisWeek > 0 ? Math.round(totalReps / totalWorkoutsThisWeek) : 0;
      console.log('Average reps per workout:', avgReps);

      // Calculate weekly volume per muscle group for bar chart using current week data only
      const muscleGroupVolumeChart: {[key: string]: number} = {};
      console.log('=== MUSCLE GROUP VOLUME DEBUG ===');
      console.log('Processing', weeklyEntries.length, 'current week entries for volume calculation');
      
      weeklyEntries.forEach((entry, index) => {
        const exercise = getExerciseData(entry);
        if (exercise && exercise.muscle_group && entry && entry.reps != null && entry.weight != null) {
          const volume = entry.reps * entry.weight; // volume per set = weight * reps
          console.log(`Entry ${index + 1}: ${exercise.name} (${exercise.muscle_group}) - ${entry.reps} × ${entry.weight} = ${volume}kg`);
          muscleGroupVolumeChart[exercise.muscle_group] = (muscleGroupVolumeChart[exercise.muscle_group] || 0) + volume;
        }
      });

      console.log('Final muscle group volume (current week):', muscleGroupVolumeChart);
      console.log('====================================');

      // Sanity check for realistic values
      const sanityCheck = Object.values(muscleGroupVolumeChart).filter(volume => volume > 50000);
      if (sanityCheck.length > 0) {
        console.warn('⚠️ WARNING: Unrealistic volume values detected:', sanityCheck);
      }

      // Create bar chart data with proper labels and values
      const volumeChartData = Object.entries(muscleGroupVolumeChart)
        .map(([muscle, volume]) => ({
          label: muscle,
          value: Math.min(volume, 10000), // Cap at 10k for display
          originalValue: volume
        }))
        .sort((a, b) => b.value - a.value);

      console.log('=== BAR CHART DATA DEBUG ===');
      console.log('Volume chart data:', volumeChartData);
      console.log('============================');

      // Update all state variables
      setWeeklyVolume(totalWeeklyVolume);
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

  const dropdownStyle = {
    opacity: dropdownAnim,
    transform: [
      {
        translateY: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-5, 0],
        }),
      },
    ],
  };

// Tooltip component
const Tooltip = ({ x, y, width, height, visible, data, onHide }: any) => {
  if (!visible || !data) return null;

  // Handle different data structures for weight progression vs volume chart
  const isVolumeChart = data.label && data.value !== undefined;
  const title = isVolumeChart ? data.label : data.date;
  const value = isVolumeChart ? data.value : data.weight;

  return (
    <View
      style={[
        {
          position: 'absolute',
          left: x - width / 2,
          top: y - height - 10,
          backgroundColor: 'rgba(20,25,45,0.95)',
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 12,
          minWidth: 60,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 6,
        }
      ]}
      pointerEvents="none"
    >
      <Text style={{ 
        color: '#E6EAF2', 
        fontSize: 12, 
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 4
      }}>
        {title}
      </Text>
      <Text style={{ 
        color: '#FFFFFF', 
        fontSize: 14, 
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {value} kg
      </Text>
    </View>
  );
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

      // Group workouts by date for per-day aggregation
      const dailyWeightMap = new Map();

      entriesData?.forEach(entry => {
        if (entry.workouts && entry.workouts.created_at && entry.exercise_id === exerciseId) {
          // Parse date correctly without timezone issues
          const workoutDate = new Date(entry.workouts.created_at);
          const dateString = workoutDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          // For each day, keep only the maximum weight
          const currentMax = dailyWeightMap.get(dateString) || { weight: 0, fullDate: workoutDate };
          if (entry.weight > currentMax.weight) {
            dailyWeightMap.set(dateString, { weight: entry.weight, fullDate: workoutDate });
          }
        }
      });

      // Convert to array and sort by date ascending
      const chartData = Array.from(dailyWeightMap.entries())
        .map(([dateString, data]) => ({
          date: dateString,
          weight: data.weight,
          reps: 1, // Single entry per day
          sets: 1,
          fullDate: data.fullDate
        }))
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime()) || [];

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
  }, [weightProgressionData, selectedExercise]);

  // Check if we have enough data for meaningful progression
  const hasEnoughProgressionData = weightProgressionData.length >= 2;

  const barChartData = useMemo(() => {
    if (weeklyVolumeData.length === 0) return null;

    // Get raw volumes - use 'value' property instead of 'volume'
    const volumes = weeklyVolumeData.map(item => item.value || 0);
    const validVolumes = volumes.filter(v => v !== undefined && v !== null && !isNaN(v));
    
    if (validVolumes.length === 0) return null;
    
    const maxVolume = Math.max(...validVolumes);
    
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
      labels: weeklyVolumeData.map(item => item.label),
      datasets: [{
        data: validVolumes
      }]
    };
  }, [weeklyVolumeData]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
      <StatusBar style="light" />
      <ScrollView 
        style={styles.scrollView} 
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
            Progress
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
                onPress={() => {
                  if (!showDropdown) {
                    setShowDropdown(true);
                    openDropdown();
                  } else {
                    closeDropdown();
                    setTimeout(() => setShowDropdown(false), 120);
                  }
                }}
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
                <Animated.View style={[
                  dropdownStyle,
                  styles.dropdownList
                ]}>
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
                </Animated.View>
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
            <View>
              <Pressable style={styles.chartCard} onPress={() => setShowTooltip(false)}>
                <View style={{
                  marginTop: 10,
                  borderRadius: 16,
                  overflow: 'hidden'
                }}>
                  <LineChart
                  data={lineChartData}
                  width={Dimensions.get('window').width - 32}
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
                      r: '8',
                      strokeWidth: '4',
                      stroke: theme.colors.primary,
                    }
                  }}
                  bezier
                  style={styles.chart}
                  onDataPointClick={(data) => {
                    const originalData = weightProgressionData[data.index];
                    if (originalData) {
                      setSelectedDataPoint(originalData);
                      setShowTooltip(true);

                      // clear previous timer
                      if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                      }

                      // start new timer
                      timeoutRef.current = setTimeout(() => {
                        setShowTooltip(false);
                      }, 2000);
                    }
                  }}
                />
                </View>
              </Pressable>
              {/* Tooltip */}
              {showTooltip && selectedDataPoint && (
                <View style={{
                  position: 'absolute',
                  left: selectedDataPoint.x - 30,
                  top: selectedDataPoint.y - 50,
                  backgroundColor: 'rgba(10,15,30,0.95)',
                  padding: 8,
                  paddingHorizontal: 10,
                  borderRadius: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                  minWidth: 80,
                  maxWidth: 200,
                  zIndex: 999,
                }}>
                  <Text style={{ 
                    color: '#E6EAF2', 
                    fontSize: 12, 
                    fontWeight: '500',
                    textAlign: 'center',
                    marginBottom: 4
                  }}>
                    {selectedDataPoint.date}
                  </Text>
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 14, 
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {selectedDataPoint.weight} kg
                  </Text>
                </View>
              )}
              
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
            {barChartData?.labels && barChartData.labels.length > 0 ? (
              <View style={styles.chartContainer}>
                <TouchableOpacity
                  onPress={(event) => {
                    console.log('Bar chart clicked');
                    // Calculate which bar was pressed based on touch position
                    const touchX = event.nativeEvent.locationX;
                    const chartWidth = Dimensions.get('window').width - 32;
                    const barWidth = chartWidth / barChartData!.labels.length;
                    const barIndex = Math.floor(touchX / barWidth);
                    
                    console.log('Touch position:', touchX, 'Bar width:', barWidth, 'Bar index:', barIndex);
                    
                    if (barIndex >= 0 && barIndex < barChartData!.labels.length) {
                      const label = barChartData!.labels[barIndex];
                      const volumeData = weeklyVolumeData.find(item => item.label === label);
                      console.log('Found volume data:', volumeData);
                      if (volumeData) {
                        // Use the same processed value that the bar chart displays for consistency
                        setSelectedBar({ label, value: volumeData.value });
                        console.log('Setting selectedBar:', { label, value: volumeData.value });
                        // Hide tooltip after 2 seconds
                        setTimeout(() => setSelectedBar(null), 2000);
                      }
                    }
                  }}
                  style={{ position: 'relative' }}
                >
                  <View style={{
                    marginTop: 10,
                    borderRadius: 16,
                    overflow: 'hidden'
                  }}>
                    <BarChart
                      data={barChartData!}
                      width={Dimensions.get('window').width - 32}
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
                    <>
                      {console.log('Rendering tooltip for:', selectedBar)}
                      <Tooltip
                        x={(Dimensions.get('window').width - 32) * (barChartData!.labels.indexOf(selectedBar!.label) + 0.5) / barChartData!.labels.length}
                        y={50} // Fixed position above the chart instead of using data value
                        width={150}
                        height={60}
                        visible={!!selectedBar}
                        data={selectedBar}
                        onHide={() => {
                          setTimeout(() => setSelectedBar(null), 2000);
                        }}
                      />
                    </>
                  )}
                  </View>
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
          <Text style={styles.chartSectionTitle}>Progress Insights</Text>
          <Text style={styles.trendText}>
            {loading ? 'Loading...' : trend}
          </Text>
          {!loading && fitnessInsights && (
            <Text style={[styles.trendText, { marginTop: 8, fontSize: 14, color: theme.colors.subtext }]}>
              {fitnessInsights}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);
}
