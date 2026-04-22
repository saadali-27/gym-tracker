import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function RoutinesScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Routines</Text>
          <Text style={styles.subtitle}>Your workout programs</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Routines</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>No active routines</Text>
            <Text style={styles.cardSubtitle}>Create or select a routine to get started</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Routines</Text>
          <View style={styles.routineGrid}>
            <TouchableOpacity style={styles.routineCard}>
              <Text style={styles.routineTitle}>Full Body</Text>
              <Text style={styles.routineSubtitle}>45 min</Text>
              <Text style={styles.routineDifficulty}>Beginner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routineCard}>
              <Text style={styles.routineTitle}>Upper Body</Text>
              <Text style={styles.routineSubtitle}>30 min</Text>
              <Text style={styles.routineDifficulty}>Intermediate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routineCard}>
              <Text style={styles.routineTitle}>Lower Body</Text>
              <Text style={styles.routineSubtitle}>35 min</Text>
              <Text style={styles.routineDifficulty}>Intermediate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routineCard}>
              <Text style={styles.routineTitle}>Cardio Blast</Text>
              <Text style={styles.routineSubtitle}>20 min</Text>
              <Text style={styles.routineDifficulty}>All Levels</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Routines</Text>
          <TouchableOpacity style={styles.createCard}>
            <Text style={styles.createTitle}>+ Create New Routine</Text>
            <Text style={styles.createSubtitle}>Build your own workout program</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Routines</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>No saved routines yet</Text>
            <Text style={styles.cardSubtitle}>Save your favorite routines for quick access</Text>
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
  routineGrid: {
    gap: 12,
  },
  routineCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  routineSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  routineDifficulty: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  createCard: {
    backgroundColor: '#3b82f6',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  createSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
  },
});
