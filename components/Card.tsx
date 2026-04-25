import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: any;
  padding?: number;
  marginBottom?: number;
  borderRadius?: number;
}

export default function Card({ 
  children, 
  style, 
  padding = theme.spacing.md,
  marginBottom = theme.spacing.md,
  borderRadius = theme.radius.md,
  ...props 
}: CardProps) {
  return (
    <View 
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: borderRadius,
          padding: padding,
          marginBottom: marginBottom,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}
