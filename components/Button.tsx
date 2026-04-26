import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle, Animated } from 'react-native';
import { theme } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export default function Button({ 
  title, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  ...props 
}: ButtonProps) {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.96,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };

    const sizeStyle = getSizeStyle(size);
    const variantStyle = getVariantStyle(variant, disabled);

    return { ...baseStyle, ...sizeStyle, ...variantStyle };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    };

    const sizeStyle = getTextSizeStyle(size);
    const variantStyle = getTextVariantStyle(variant, disabled);

    return { ...baseStyle, ...sizeStyle, ...variantStyle };
  };

  return (
    <Animated.View 
      style={[
        getButtonStyle(),
        style,
        {
          transform: [{ scale: scaleValue }]
        }
      ]} 
    >
      <TouchableOpacity 
        style={StyleSheet.absoluteFillObject}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        <Text style={getTextStyle()}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const getSizeStyle = (size: 'small' | 'medium' | 'large'): ViewStyle => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: 10,
        paddingHorizontal: 16,
      };
    case 'large':
      return {
        paddingVertical: 18,
        paddingHorizontal: 24,
      };
    default: // medium
      return {
        paddingVertical: 14,
        paddingHorizontal: 20,
      };
  }
};

const getVariantStyle = (variant: 'primary' | 'secondary' | 'danger', disabled: boolean): ViewStyle => {
  if (disabled) {
    return {
      backgroundColor: theme.colors.border,
    };
  }

  switch (variant) {
    case 'danger':
      return {
        backgroundColor: 'rgba(255,107,107,0.15)',
      };
    case 'secondary':
      return {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      };
    default: // primary
      return {
        backgroundColor: '#7C9EFF',
      };
  }
};

const getTextSizeStyle = (size: 'small' | 'medium' | 'large'): TextStyle => {
  switch (size) {
    case 'small':
      return {
        fontSize: 14,
      };
    case 'large':
      return {
        fontSize: 18,
      };
    default: // medium
      return {
        fontSize: 16,
      };
  }
};

const getTextVariantStyle = (variant: 'primary' | 'secondary' | 'danger', disabled: boolean): TextStyle => {
  if (disabled) {
    return {
      color: theme.colors.subtext,
    };
  }

  switch (variant) {
    case 'danger':
      return {
        color: '#FF6B6B',
      };
    case 'secondary':
      return {
        color: '#E6EAF2',
      };
    default: // primary
      return {
        color: '#0A0F1E',
      };
  }
};
