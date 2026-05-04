export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 12,      // Small text
    sm: 14,      // Label text
    base: 16,    // Body text
    lg: 18,      // Large body
    xl: 20,      // Small title
    '2xl': 22,   // Title
    '3xl': 28,   // Large title
    '4xl': 32,   // Header
  },

  // Font weights (React Native compatible)
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Typography presets with improved hierarchy
  presets: {
    // Display text - largest, for hero sections
    display: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 1.1,
    },
    // Title text - main screen titles
    title: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.2,
    },
    // Subtitle text - section headers
    subtitle: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.3,
    },
    // Body text - main content
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    // Label text - form labels, buttons
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    // Small text - captions, hints
    small: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.4,
    },
    // Caption text - smallest, for metadata
    caption: {
      fontSize: 10,
      fontWeight: '400',
      lineHeight: 1.3,
    },
  },
};

export default typography;
