import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface StandardHeaderProps {
  title: string;
}

export const StandardHeader: React.FC<StandardHeaderProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 1.2,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    width: '100%',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    opacity: 0.6,
  },
});

export default StandardHeader;
