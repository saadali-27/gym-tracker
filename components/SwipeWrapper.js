import React from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import DashboardScreen from '../screens/DashboardScreen';
import LogWorkoutScreen from '../screens/LogWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import RoutinesScreen from '../screens/RoutinesScreen';

export default function SwipeWrapper() {
  const route = useRoute();
  
  // Map bottom tab names to screen components
  const getCurrentScreen = () => {
    switch (route.name) {
      case 'Home':
        return <DashboardScreen />;
      case 'Log':
        return <LogWorkoutScreen />;
      case 'History':
        return <HistoryScreen />;
      case 'Progress':
        return <ProgressScreen />;
      case 'Routines':
        return <RoutinesScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0F1E', paddingBottom: 100 }}>
      {getCurrentScreen()}
    </View>
  );
}
