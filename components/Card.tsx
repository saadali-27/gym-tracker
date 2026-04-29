import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewProps, Animated } from 'react-native';
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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }],
        },
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
    </Animated.View>
  );
}

export default Card;
