import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track your fitness journey</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weight Progress</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>No weight data yet</Text>
            <Text style={styles.cardSubtitle}>Start tracking your weight to see progress</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strength Gains</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>No strength data yet</Text>
            <Text style={styles.cardSubtitle}>Log workouts to track strength improvements</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Measurements</Text>
          <View style={styles.measurementsGrid}>
            <View style={styles.measurementCard}>
              <Text style={styles.measurementLabel}>Chest</Text>
              <Text style={styles.measurementValue}>--</Text>
            </View>
            <View style={styles.measurementCard}>
              <Text style={styles.measurementLabel}>Arms</Text>
              <Text style={styles.measurementValue}>--</Text>
            </View>
            <View style={styles.measurementCard}>
              <Text style={styles.measurementLabel}>Waist</Text>
              <Text style={styles.measurementValue}>--</Text>
            </View>
            <View style={styles.measurementCard}>
              <Text style={styles.measurementLabel}>Legs</Text>
              <Text style={styles.measurementValue}>--</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>No achievements yet</Text>
            <Text style={styles.cardSubtitle}>Complete workouts to earn achievements</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>No goals set</Text>
            <Text style={styles.cardSubtitle}>Set fitness goals to track your progress</Text>
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
    alignItems: 'center',
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
  },
  measurementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  measurementLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
