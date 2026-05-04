import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.presets.title.fontSize,
    fontWeight: '600',
    lineHeight: theme.typography.presets.title.lineHeight,
    color: '#ffffff', // Force white for visibility
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.typography.presets.subtitle.fontSize,
    fontWeight: '500',
    lineHeight: theme.typography.presets.subtitle.lineHeight,
    color: '#ffffff', // Force white for visibility
    marginTop: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    width: '100%',
    marginTop: theme.spacing.md,
  },
});
