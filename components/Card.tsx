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

const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  padding = 18, 
  marginBottom = 16, 
  ...props 
}) => {
  return (
    <View 
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding,
          marginBottom,
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

export default Card;
