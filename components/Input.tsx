import React from 'react';
import { TextInput, TextInputProps, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  style?: ViewStyle;
}

export default function Input({ style, ...props }: InputProps) {
  return (
    <TextInput
      style={[
        styles.input,
        style
      ]}
      placeholderTextColor={theme.colors.subtext}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.text,
    fontSize: 16,
  },
});
