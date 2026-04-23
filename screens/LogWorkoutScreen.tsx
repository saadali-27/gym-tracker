import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../services/supabase';

export default function LogWorkoutScreen() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');

    if (error) {
      console.log("ERROR:", error);
    } else {
      console.log("DATA:", data);
      setExercises(data || []);
    }

    setLoading(false);
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setSets('');
    setReps('');
    setWeight('');
  };

  const validateInputs = () => {
    if (!sets.trim() || !reps.trim() || !weight.trim()) {
      Alert.alert('Error', 'All fields must be filled');
      return false;
    }
    
    const setsNum = parseInt(sets);
    const repsNum = parseInt(reps);
    const weightNum = parseFloat(weight);
    
    if (isNaN(setsNum) || isNaN(repsNum) || isNaN(weightNum)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return false;
    }
    
    if (setsNum <= 0 || repsNum <= 0 || weightNum <= 0) {
      Alert.alert('Error', 'All values must be greater than 0');
      return false;
    }
    
    return true;
  };

  const saveWorkout = async () => {
    if (!validateInputs()) return;
    if (!selectedExercise) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }

    setSaving(true);

    try {
      // Create workout entry
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert([{ date: new Date().toISOString() }])
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Create workout entry
      const { error: entryError } = await supabase
        .from('workout_entries')
        .insert([{
          workout_id: workoutData.id,
          exercise_id: selectedExercise.id,
          sets: parseInt(sets),
          reps: parseInt(reps),
          weight: parseFloat(weight)
        }]);

      if (entryError) throw entryError;

      Alert.alert('Success', 'Workout saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset inputs
            setSelectedExercise(null);
            setSets('');
            setReps('');
            setWeight('');
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Log Workout
        </Text>
        
        <TextInput
          style={{
            height: 40,
            borderColor: '#ddd',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            marginBottom: 20,
            fontSize: 16,
          }}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <Text>Loading...</Text>
        ) : filteredExercises.length === 0 ? (
          <Text>No exercises found</Text>
        ) : (
          filteredExercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              onPress={() => handleExerciseSelect(ex)}
              style={{
                padding: 15,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
                backgroundColor: selectedExercise?.id === ex.id ? '#e3f2fd' : 'white',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 5 }}>
                {ex.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {ex.category || 'No category'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedExercise && (
        <View style={{
          padding: 20,
          backgroundColor: '#f5f5f5',
          borderTopWidth: 1,
          borderTopColor: '#ddd',
        }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            Selected Exercise:
          </Text>
          <Text style={{ fontSize: 18, color: '#2196f3', marginBottom: 16 }}>
            {selectedExercise.name}
          </Text>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>Sets:</Text>
            <TextInput
              style={{
                height: 40,
                borderColor: '#ddd',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: 'white',
              }}
              placeholder="Enter sets"
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
            />
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>Reps:</Text>
            <TextInput
              style={{
                height: 40,
                borderColor: '#ddd',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: 'white',
              }}
              placeholder="Enter reps"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
            />
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>Weight (lbs/kg):</Text>
            <TextInput
              style={{
                height: 40,
                borderColor: '#ddd',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: 'white',
              }}
              placeholder="Enter weight"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity
            style={{
              backgroundColor: saving ? '#ccc' : '#2196f3',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={saveWorkout}
            disabled={saving}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {saving ? 'Saving...' : 'Save Workout'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}