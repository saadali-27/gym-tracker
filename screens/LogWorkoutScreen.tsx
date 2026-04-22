import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { supabase } from '../services/supabase';

export default function LogWorkoutScreen() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <ScrollView style={{ padding: 20 }}>
      {loading ? (
        <Text>Loading...</Text>
      ) : exercises.length === 0 ? (
        <Text>No exercises found</Text>
      ) : (
        exercises.map((ex) => (
          <Text key={ex.id} style={{ fontSize: 18, marginBottom: 10 }}>
            {ex.name}
          </Text>
        ))
      )}
    </ScrollView>
  );
}