import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function LogWorkoutScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Workout</Text>
          <Text style={styles.subtitle}>Track your training session</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Start Quick Workout</Text>
            <Text style={styles.cardSubtitle}>Begin a new training session</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Types</Text>
          <View style={styles.workoutTypes}>
            <TouchableOpacity style={styles.workoutCard}>
              <Text style={styles.workoutTitle}>Strength</Text>
              <Text style={styles.workoutSubtitle}>Weight training</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.workoutCard}>
              <Text style={styles.workoutTitle}>Cardio</Text>
              <Text style={styles.workoutSubtitle}>Running, cycling, etc.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.workoutCard}>
              <Text style={styles.workoutTitle}>Flexibility</Text>
              <Text style={styles.workoutSubtitle}>Stretching, yoga</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.workoutCard}>
              <Text style={styles.workoutTitle}>Sports</Text>
              <Text style={styles.workoutSubtitle}>Team activities</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Exercises</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>No exercises logged yet</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  workoutTypes: {
    gap: 12,
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  workoutSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});
