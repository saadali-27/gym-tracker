import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'danger';
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
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: theme.radius.lg,
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
    <TouchableOpacity 
      style={[
        getButtonStyle(),
        style
      ]} 
      disabled={disabled}
      {...props}
    >
      <Text style={getTextStyle()}>
        {title}
      </Text>
    </TouchableOpacity>
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

const getVariantStyle = (variant: 'primary' | 'danger', disabled: boolean): ViewStyle => {
  if (disabled) {
    return {
      backgroundColor: theme.colors.border,
    };
  }

  switch (variant) {
    case 'danger':
      return {
        backgroundColor: theme.colors.danger,
      };
    default: // primary
      return {
        backgroundColor: theme.colors.primary,
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

const getTextVariantStyle = (variant: 'primary' | 'danger', disabled: boolean): TextStyle => {
  if (disabled) {
    return {
      color: theme.colors.subtext,
    };
  }

  return {
    color: '#ffffff',
  };
};
