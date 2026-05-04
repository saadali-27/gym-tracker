import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TextStyle } from 'react-native';
import { theme } from '../theme';

interface GhostButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const GhostButton: React.FC<GhostButtonProps> = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.text} />
      ) : (
        <Text style={{color: '#ffffff', fontSize: 16, fontWeight: 'bold'}}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
