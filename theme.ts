// Import modular design system
import { theme as designSystem } from './design-system';

// Export theme for backward compatibility
export const theme = designSystem;

// Also export individual modules for granular imports
export const { colors, spacing, typography, radius } = designSystem;
