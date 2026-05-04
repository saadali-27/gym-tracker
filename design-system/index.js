// Global UI Design System
// Clean, minimal, premium design for React Native Expo app

export { default as colors } from './colors';
export { default as spacing } from './spacing';
export { default as typography } from './typography';
export { default as radius } from './radius';

// Combined theme object for easy import
import colors from './colors';
import spacing from './spacing';
import typography from './typography';
import radius from './radius';

export const theme = {
  colors,
  spacing,
  typography,
  radius,
};

export default theme;
