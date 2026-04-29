import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated';

// Card entry animation
export const useCardEntryAnimation = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  const animateEntry = () => {
    'worklet';
    setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 180,
        easing: Easing.out(Easing.ease),
      });
    }, delay);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return {
    animatedStyle,
    animateEntry,
  };
};

// Button press animation
export const useButtonPressAnimation = () => {
  const scale = useSharedValue(1);

  const animatePress = () => {
    'worklet';
    scale.value = withSpring(0.96, {
      damping: 15,
      stiffness: 300,
    });
  };

  const animateRelease = () => {
    'worklet';
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    animatePress,
    animateRelease,
  };
};

// Screen transition animation
export const useScreenTransitionAnimation = () => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  const animateIn = () => {
    'worklet';
    opacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return {
    animatedStyle,
    animateIn,
  };
};

// Dropdown animation
export const useDropdownAnimation = () => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-5);

  const animateOpen = () => {
    'worklet';
    opacity.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
  };

  const animateClose = () => {
    'worklet';
    opacity.value = withTiming(0, {
      duration: 120,
      easing: Easing.in(Easing.ease),
    });
    translateY.value = withTiming(-5, {
      duration: 120,
      easing: Easing.in(Easing.ease),
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return {
    animatedStyle,
    animateOpen,
    animateClose,
  };
};

// Staggered list item animation
export const useStaggeredListAnimation = (index: number, maxItems = 6) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const delay = Math.min(index * 30, maxItems * 30);

  const animateEntry = () => {
    'worklet';
    setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 180,
        easing: Easing.out(Easing.ease),
      });
    }, delay);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return {
    animatedStyle,
    animateEntry,
  };
};

// Simple fade animation
export const useFadeAnimation = (initialValue = 0) => {
  const opacity = useSharedValue(initialValue);

  const animateIn = () => {
    'worklet';
    opacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  };

  const animateOut = () => {
    'worklet';
    opacity.value = withTiming(0, {
      duration: 150,
      easing: Easing.in(Easing.ease),
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    animateIn,
    animateOut,
  };
};
