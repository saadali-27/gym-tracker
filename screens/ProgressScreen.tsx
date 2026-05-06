import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import { theme } from '../theme';
import { AppHeader, RowItem, SectionLabel, StatBox, PrimaryButton, GhostButton } from '../components';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import RNPickerSelect from 'react-native-picker-select';
import { getMostTrainedMuscle } from '../utils/muscleUtils';

const formatWeight = (value: number) => `${value.toLocaleString()}`;

const getCurrentDayLabel = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1; // Convert to Monday=0, Sunday=6
  return days[adjustedToday];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  headerDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  
  // Section styles
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  
  // Card styles matching Dashboard
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  
  // Weekly Volume Section
  weeklyVolumeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weeklyVolumeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.subtext,
    textTransform: 'uppercase',
  },
  weeklyVolumeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 8,
  },
  weeklyVolumeUnit: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  
  // Chart containers with fixed height
  chartContainer: {
    marginBottom: 20,
  },
  barChartContainer: {
    marginBottom: 20,
  },
  
  // Personal Records Section
  personalRecordsButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  personalRecordsText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  personalRecordsArrow: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
  
  // This Week Section
  thisWeekContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  thisWeekCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  thisWeekValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  thisWeekLabel: {
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  
  // PR Display styles
  prDisplayContainer: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  prValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  prExerciseName: {
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  
  // Insights styles
  insightsContainer: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
  },
  insightsText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  insightsSubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
    lineHeight: 20,
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
    borderRadius: 12,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    transform: [{ scaleY: dropdownScale }],
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
  
  // Tooltip styles
  tooltipDate: {
    color: theme.colors.subtext,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  tooltipValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: 200,
    zIndex: 999,
  },
  legendContainer: {
    position: 'relative',
  },
  
  // Weight progress chart styles
  emptyStateText: {
    textAlign: 'center',
    color: theme.colors.subtext,
    fontSize: 16,
    marginTop: 60,
  },
  weightChangeContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  weightChangeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  noDataText: {
    color: theme.colors.subtext,
    fontSize: 14,
    fontStyle: 'italic',
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
  const [dropdownScale] = useState(new Animated.Value(0.95));
  const [dropdownOpacity] = useState(new Animated.Value(0));
  const [stats, setStats] = useState({ totalVolume: 0, totalReps: 0, totalSets: 0 });
  const [muscleGroupVolume, setMuscleGroupVolume] = useState<{[key: string]: number}>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [entriesData, setEntriesData] = useState<any[]>([]);
  const [selectedBar, setSelectedBar] = useState<{ label: string; value: number } | null>(null);
  const [fitnessInsights, setFitnessInsights] = useState('');
  const screenWidth = Dimensions.get('window').width;

  // Helper functions moved to component level for accessibility
  const getExerciseData = (entry: any) => {
    if (!entry || !entry.exercises) return null;
    return Array.isArray(entry.exercises) ? entry.exercises[0] : entry.exercises;
  };

  const getWorkoutData = (entry: any) => {
    if (!entry || !entry.workouts) return null;
    return Array.isArray(entry.workouts) ? entry.workouts[0] : entry.workouts;
  };

  const openDropdown = () => {
    Animated.parallel([
      Animated.spring(dropdownScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(dropdownScale, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProgressData();
    }, [])
  );

  // Also refresh data when component comes into focus
  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      // Reset state to ensure fresh data
      setEntriesData([]);
      setWeeklyVolumeData([]);
      setWeightProgressionData([]);
      setSelectedBar(null);
      
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

      // Standardized date parsing function - use everywhere
      const parseWorkoutDate = (dateValue: any) => {
        if (!dateValue) return null;
        
        // Create date object from stored value without modifying it
        const date = new Date(dateValue);
        
        // Check if date is valid
        if (isNaN(date.getTime())) return null;
        
        return date;
      };

      // Standardized date comparison function
      const isSameDay = (date1: Date, date2: Date) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
      };

      // STEP 2: SAFE DATE HANDLING
      const safeDate = (value: any) => {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      };

      // Helper function to get start of week (Monday-Saturday schedule)
      const getStartOfWeek = () => {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        const start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        return start;
      };

      // Helper function to get end of week (Saturday for Mon-Sat schedule)
      const getEndOfWeek = () => {
        const start = getStartOfWeek();
        const end = new Date(start);
        end.setDate(start.getDate() + 5); // Monday + 5 days = Saturday
        end.setHours(23, 59, 59, 999);
        return end;
      };

      console.log('Raw entries data:', entriesData);
      console.log('Total entries count:', entriesData?.length || 0);
      
            
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

      // WEEKLY VOLUME (FIX - Mon-Sat schedule)
      const weeklyVolume = entriesData
        ?.filter(e => {
          const workout = getWorkoutData(e);
          if (!workout || !workout.created_at) return false;
          const entryDate = new Date(workout.created_at);
          return entryDate >= getStartOfWeek() && entryDate <= getEndOfWeek();
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
        return entryDate >= getStartOfWeek() && entryDate <= getEndOfWeek();
      }) || [];

      const previousWeekEntries = entriesData?.filter(e => {
        const workout = getWorkoutData(e);
        if (!workout || !workout.created_at) return false;
        const entryDate = new Date(workout.created_at);
        const startOfPreviousWeek = new Date(getStartOfWeek());
        startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);
        const endOfPreviousWeek = new Date(startOfPreviousWeek);
        endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 5);
        return entryDate >= startOfPreviousWeek && entryDate <= endOfPreviousWeek;
      }) || [];

      console.log('Current week entries (Mon-Sat):', weeklyEntries.length);
      console.log('Previous week entries (Last Mon-Sat):', previousWeekEntries.length);

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
          trendMessage = `Excellent first week with ${formatWeight(totalWeeklyVolume)} total volume. You started with impressive intensity.`;
        } else if (totalWeeklyVolume >= 1000) {
          trendMessage = `Strong first week achieving ${formatWeight(totalWeeklyVolume)} total volume. Great foundation established.`;
        } else if (totalWeeklyVolume >= 500) {
          trendMessage = `Good start with ${formatWeight(totalWeeklyVolume)} total volume. Keep building momentum.`;
        } else {
          trendMessage = `First week completed with ${formatWeight(totalWeeklyVolume)} total volume. Every fitness journey begins here.`;
        }
      } else if (isFirstWeek && !hasCurrentWeekData) {
        trendMessage = "Ready to begin your fitness journey? Log your first workout to start tracking progress.";
      } else {
        volumeChange = totalWeeklyVolume - previousWeekVolume;
        volumeChangePercent = Math.round((volumeChange / previousWeekVolume) * 100);
        
        // Professional fitness app insights with actionable recommendations
        if (volumeChangePercent >= 50) {
          trendMessage = `Outstanding performance with +${volumeChangePercent}% volume increase (${formatWeight(volumeChange)}kg). Consider proper recovery this week.`;
        } else if (volumeChangePercent >= 25) {
          trendMessage = `Excellent progress showing +${volumeChangePercent}% volume increase (${formatWeight(volumeChange)}kg). Maintain this training intensity.`;
        } else if (volumeChangePercent >= 10) {
          trendMessage = `Solid improvement with +${volumeChangePercent}% volume increase (${formatWeight(volumeChange)}kg). Consistency is paying off.`;
        } else if (volumeChangePercent > 0) {
          trendMessage = `Steady progress with +${volumeChangePercent}% volume increase (${formatWeight(volumeChange)}kg). Every repetition contributes.`;
        } else if (volumeChangePercent <= -30) {
          trendMessage = `Significant volume decrease of ${volumeChangePercent}% (${formatWeight(Math.abs(volumeChange))}kg). Focus on training consistency this week.`;
        } else if (volumeChangePercent <= -10) {
          trendMessage = `Volume decreased by ${Math.abs(volumeChangePercent)}% (${formatWeight(Math.abs(volumeChange))}kg). Time to refocus on training goals.`;
        } else if (volumeChangePercent < 0) {
          trendMessage = `Slight volume decrease of ${volumeChangePercent}% (${formatWeight(Math.abs(volumeChange))}kg). Minor adjustments to training needed.`;
        } else {
          trendMessage = `Consistent training volume at ${formatWeight(totalWeeklyVolume)}. Consider a 5-10% increase next week for progression.`;
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
          insights.push("Excellent training frequency with 4+ workouts this week showing strong commitment.");
        } else if (totalWorkoutsThisWeek >= 3) {
          insights.push("Good consistency with 3 workouts this week. Maintain this training schedule.");
        } else if (totalWorkoutsThisWeek >= 2) {
          insights.push("Solid start with 2 workouts this week. Aim for 3-4 sessions for optimal results.");
        } else if (totalWorkoutsThisWeek === 1) {
          insights.push("One workout completed this week. Add 1-2 more sessions for better progress.");
        } else {
          insights.push("No workouts logged this week. Start with 2-3 training sessions.");
        }

        // Volume intensity analysis
        const avgVolumePerWorkout = totalWeeklyVolume > 0 ? Math.round(totalWeeklyVolume / totalWorkoutsThisWeek) : 0;
        if (avgVolumePerWorkout > 2000) {
          insights.push("High training intensity with excellent average volume per workout.");
        } else if (avgVolumePerWorkout > 1000) {
          insights.push("Good training intensity with solid volume per workout.");
        } else if (avgVolumePerWorkout > 0) {
          insights.push("Building training intensity. Consider gradual increases in weight or repetitions.");
        }

        // Muscle balance analysis (if we have multiple muscle groups)
        const muscleGroups = Object.keys({});
        if (muscleGroups.length >= 3) {
          insights.push("Excellent muscle balance training multiple muscle groups.");
        } else if (muscleGroups.length === 2) {
          insights.push("Focused training on specific muscle groups. Consider adding variety for balanced development.");
        } else if (muscleGroups.length === 1) {
          insights.push("Highly focused training on one muscle group. Add exercises for other muscle groups.");
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
    opacity: dropdownOpacity,
    transform: [
      {
        scale: dropdownScale,
      },
      {
        translateY: dropdownOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      }
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
      <Text style={styles.tooltipDate}>
        {title}
      </Text>
      <Text style={styles.tooltipValue}>
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

  // Generate weekly bar chart data based on actual workout dates
  const weeklyBarChartData = useMemo(() => {
    // Only show Mon-Sat (6 days), no Sunday
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    
    // Initialize data for all 6 days with 0 values
    const weeklyData = days.map(() => 0);
    
    // Group workouts by actual date
    entriesData?.forEach(entry => {
      const workout = getWorkoutData(entry);
      if (!workout || !workout.created_at) return;
      
      const workoutDate = new Date(workout.created_at);
      const dayIndex = workoutDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      
      // Convert to Monday=0, Tuesday=1, ..., Saturday=5
      const adjustedIndex = dayIndex === 0 ? 5 : dayIndex - 1;
      
      // Only include Mon-Sat data (indices 0-5)
      if (adjustedIndex >= 0 && adjustedIndex <= 5) {
        weeklyData[adjustedIndex] += entry.weight * entry.reps;
      }
    });
    
    return {
      labels: days,
      datasets: [{
        data: weeklyData,
        color: (opacity = 1, dataIndex = null) => {
          const actualIndex = dataIndex !== null ? dataIndex : 0;
          const todayIndex = today === 0 ? 5 : today - 1; // Convert to Monday=0, Saturday=5
          return actualIndex === todayIndex ? `rgba(74, 222, 128, ${opacity})` : `rgba(55, 65, 81, ${opacity})`;
        },
      }]
    };
  }, [entriesData]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            Progress
          </Text>
        </View>
        <View style={styles.headerDivider} />

        {/* WEEKLY VOLUME Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.weeklyVolumeContainer}>
              <Text style={styles.weeklyVolumeLabel}>Weekly Volume</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.weeklyVolumeValue}>
                  {loading ? '0' : formatWeight(weeklyVolume)}
                </Text>
                <Text style={styles.weeklyVolumeUnit}>kg lifted</Text>
              </View>
            </View>
            
            {/* 7-Day Bar Chart */}
            <View style={styles.barChartContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
                {weeklyBarChartData.datasets[0].data.map((value, index) => {
                  const isCurrentDay = weeklyBarChartData.labels[index] === getCurrentDayLabel();
                  const displayValue = Math.max(value, 10);
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={{ width: 40, alignItems: 'center', marginHorizontal: 2 }}
                      onPress={() => {
                        setSelectedBar({ label: weeklyBarChartData.labels[index], value });
                        setTimeout(() => setSelectedBar(null), 2000);
                      }}
                    >
                      <View style={{ height: 140, justifyContent: 'flex-end' }}>
                        <View style={{
                          width: 22,
                          height: (displayValue / (Math.max(...weeklyBarChartData.datasets[0].data) * 1.2)) * 140,
                          backgroundColor: isCurrentDay ? theme.colors.primary : 'rgba(55, 65, 81, 1)',
                          borderRadius: 6,
                        }} />
                      </View>
                      <Text style={{
                        color: isCurrentDay ? theme.colors.primary : theme.colors.text,
                        fontSize: 12,
                        fontWeight: '500',
                        textAlign: 'center',
                        marginTop: 8,
                      }}>
                        {weeklyBarChartData.labels[index]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {selectedBar && (
                <View style={[styles.tooltipContainer, { 
                  position: 'absolute',
                  top: 20,
                  left: ((Dimensions.get('window').width - 64) / weeklyBarChartData.labels.length) * (weeklyBarChartData.labels.indexOf(selectedBar.label) + 0.5) - 40,
                }]}>
                  <Text style={styles.tooltipDate}>
                    {selectedBar.label}
                  </Text>
                  <Text style={styles.tooltipValue}>
                    {selectedBar.value} kg
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* PERSONAL RECORDS Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          
          <TouchableOpacity 
            style={styles.personalRecordsButton}
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
            <Text style={styles.personalRecordsText}>
              {selectedExercise 
                ? userExercises.find(ex => ex.id === selectedExercise)?.name || 'Select an exercise'
                : 'Select an exercise'
              } ›
            </Text>
          </TouchableOpacity>
          
          {/* PR Display */}
          {selectedExercise && (
            <View style={styles.prDisplayContainer}>
              <Text style={styles.prValue}>
                {formatWeight(calculatePersonalRecord(selectedExercise))} kg
              </Text>
              <Text style={styles.prExerciseName}>
                {userExercises.find(ex => ex.id === selectedExercise)?.name || 'Select an exercise'}
              </Text>
            </View>
          )}
          
          {showDropdown && (
            <Animated.View style={[
              dropdownStyle,
              styles.dropdownList,
              { marginTop: 8 }
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

        {/* THIS WEEK Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          
          <View style={styles.thisWeekContainer}>
            <View style={styles.thisWeekCard}>
              <Text style={styles.thisWeekValue}>
                {loading ? '0' : totalWorkoutsThisWeek}
              </Text>
              <Text style={styles.thisWeekLabel}>Sessions</Text>
            </View>
            
            <View style={styles.thisWeekCard}>
              <Text style={styles.thisWeekValue}>
                {loading ? '0' : averageRepsPerWorkout}
              </Text>
              <Text style={styles.thisWeekLabel}>Avg reps</Text>
            </View>
          </View>
        </View>

        {/* PROGRESS INSIGHTS Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Insights</Text>
          
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsText}>
              {loading ? 'Loading...' : trend}
            </Text>
            {!loading && fitnessInsights && (
              <Text style={styles.insightsSubtext}>
                {fitnessInsights}
              </Text>
            )}
          </View>
        </View>

        {/* Weight Progress Chart */}
        {selectedExercise && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Weight Progress</Text>
              
              {weightProgressionData.length === 0 ? (
                <View style={styles.chartContainer}>
                  <Text style={styles.emptyStateText}>
                    No data yet. Start logging workouts.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={weightProgressionData.map((item, index) => ({
                        value: item.weight,
                        label: item.date,
                      }))}
                      width={Dimensions.get('window').width - 64}
                      height={160}
                      color={theme.colors.primary}
                      thickness={2}
                      curved={true}
                      dataPointsRadius={8}
                      dataPointsColor={theme.colors.primary}
                      hideAxesAndRules={true}
                      xAxisThickness={0}
                      yAxisThickness={0}
                      yAxisTextStyle={{
                        color: theme.colors.text,
                        fontSize: 11,
                        fontWeight: '500',
                      }}
                      xAxisLabelTextStyle={{
                        color: theme.colors.text,
                        fontSize: 11,
                        fontWeight: '500',
                      }}
                      noOfSections={4}
                      stepHeight={35}
                      maxValue={Math.max(...weightProgressionData.map(item => item.weight)) * 1.2}
                      onPress={(data: any, index: number) => {
                        const selectedData = weightProgressionData[index];
                        setSelectedDataPoint(selectedData);
                        setShowTooltip(true);

                        if (timeoutRef.current) {
                          clearTimeout(timeoutRef.current);
                        }

                        timeoutRef.current = setTimeout(() => {
                          setShowTooltip(false);
                        }, 2000);
                      }}
                    />
                  </View>
                  
                  {showTooltip && selectedDataPoint && (
                    <View style={[styles.tooltipContainer, { 
                      position: 'absolute',
                      top: 30,
                      left: (Dimensions.get('window').width - 64) * (weightProgressionData.findIndex(item => item.date === selectedDataPoint.date) + 0.5) / weightProgressionData.length - 75,
                    }]}>
                      <Text style={styles.tooltipDate}>
                        {selectedDataPoint.date}
                      </Text>
                      <Text style={styles.tooltipValue}>
                        {selectedDataPoint.weight} kg
                      </Text>
                    </View>
                  )}
                  
                  {/* Weight Change Indicator */}
                  <View style={styles.weightChangeContainer}>
                    {weightProgressionData.length === 1 ? (
                      <Text style={styles.noDataText}>
                        First workout logged! Keep tracking progress.
                      </Text>
                    ) : (
                      (() => {
                        const latest = weightProgressionData[weightProgressionData.length - 1];
                        const previous = weightProgressionData[weightProgressionData.length - 2];
                        const weightChange = latest.weight - previous.weight;
                        
                        return (
                          <Text style={[
                            styles.weightChangeText,
                            { 
                              color: weightChange > 0 ? theme.colors.primary : 
                                     weightChange < 0 ? '#f87171' : theme.colors.subtext 
                            }
                          ]}>
                            {weightChange > 0 ? '+' : ''}{weightChange} kg
                          </Text>
                        );
                      })()
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Muscle Volume Chart */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Muscle Volume</Text>
            <View style={styles.chartContainer}>
              {!barChartData?.labels || barChartData.labels.length === 0 ? (
                <Text style={styles.emptyStateText}>
                  No data yet. Start logging workouts.
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
                  {barChartData.datasets[0].data.map((value, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={{ width: 40, alignItems: 'center', marginHorizontal: 2 }}
                      onPress={() => {
                        const volumeData = weeklyVolumeData.find(item => item.label === barChartData.labels[index]);
                        if (volumeData) {
                          setSelectedBar({ label: barChartData.labels[index], value: volumeData.value });
                          setTimeout(() => setSelectedBar(null), 2000);
                        }
                      }}
                    >
                      <View style={{ height: 120, justifyContent: 'flex-end' }}>
                        <View style={{
                          width: 22,
                          height: (value / (Math.max(...barChartData.datasets[0].data) * 1.2)) * 120,
                          backgroundColor: theme.colors.primary,
                          borderRadius: 6,
                        }} />
                      </View>
                      <Text style={{
                        color: theme.colors.text,
                        fontSize: 12,
                        fontWeight: '500',
                        textAlign: 'center',
                        marginTop: 8,
                      }}>
                        {barChartData.labels[index]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
                
              {selectedBar && barChartData && (
                  <View style={[styles.tooltipContainer, { 
                    position: 'absolute',
                    top: 20,
                    left: ((Dimensions.get('window').width - 64) / barChartData.labels.length) * (barChartData.labels.indexOf(selectedBar.label) + 0.5) - 40,
                  }]}>
                    <Text style={styles.tooltipDate}>
                      {selectedBar.label}
                    </Text>
                    <Text style={styles.tooltipValue}>
                      {selectedBar.value} kg
                    </Text>
                  </View>
                )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
