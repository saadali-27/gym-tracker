import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface StatBoxProps {
  label: string;
  value: string;
  accent?: boolean;
}

export const StatBox: React.FC<StatBoxProps> = ({ label, value, accent = false }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, accent && styles.accentValue]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  accentValue: {
    color: theme.colors.primary,
  },
  label: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs,
  },
});
