import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';

const AppButton = ({ 
  title, 
  variant = 'primary', 
  onPress, 
  disabled = false,
  style = null,
  ...props 
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(255,107,107,0.15)',
        };
      default: // primary
        return {
          backgroundColor: '#7C9EFF',
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return '#E6EAF2';
      case 'danger':
        return '#FF6B6B';
      default: // primary
        return '#0A0F1E';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.container,
          getVariantStyles(),
          disabled && styles.disabled,
          style
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        {...props}
      >
        <Text 
          style={[
            styles.text,
            { color: getTextColor() },
            disabled && styles.disabledText
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 80,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default AppButton;
