export interface WorkoutEntry {
  id: any;
  exercise_id?: any;
  reps: any;
  weight: any;
  exercises: {
    id: any;
    name: any;
    muscle_group: any;
  }[];
  workouts: {
    id: any;
    date?: any;
    created_at?: any;
  }[];
}

export interface MostTrainedMuscle {
  muscle: string;
  volume: number;
}

/**
 * Calculate most trained muscle group based on total volume
 * Volume = weight × reps (each entry represents one set)
 */
export function getMostTrainedMuscle(entries: WorkoutEntry[]): MostTrainedMuscle {
  if (!entries || entries.length === 0) {
    return { muscle: 'No data yet', volume: 0 };
  }

  const muscleVolume: { [key: string]: number } = {};

  // Helper to safely access nested data
  const getExerciseData = (entry: any) => 
    Array.isArray(entry.exercises) ? entry.exercises[0] : entry.exercises;

  // Loop through all workouts and aggregate volume by muscle group
  entries.forEach(entry => {
    const exercise = getExerciseData(entry);
    const muscleGroup = exercise?.muscle_group;
    
    if (muscleGroup) {
      // Calculate total volume for this entry: weight × reps (each entry is one set)
      const entryVolume = entry.weight * entry.reps;
      muscleVolume[muscleGroup] = (muscleVolume[muscleGroup] || 0) + entryVolume;
    }
  });

  // Find muscle group with highest total volume
  const mostTrained = Object.entries(muscleVolume).reduce(
    (max, [muscle, volume]) => 
      volume > max.volume ? { muscle, volume } : max,
    { muscle: 'No data yet', volume: 0 }
  );

  return mostTrained;
}
