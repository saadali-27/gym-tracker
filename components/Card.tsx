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
  borderRadius = 18,
  ...props 
}: CardProps) {
  return (
    <View 
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          borderRadius: borderRadius,
          padding: padding,
          marginBottom: marginBottom,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}
