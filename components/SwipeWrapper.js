import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';

import DashboardScreen from '../screens/DashboardScreen';
import LogWorkoutScreen from '../screens/LogWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import RoutinesScreen from '../screens/RoutinesScreen';

const Tab = createMaterialTopTabNavigator();

export default function SwipeWrapper() {
  const route = useRoute();
  
  // Map bottom tab names to initial screen indices
  const getInitialRouteName = () => {
    switch (route.name) {
      case 'Home':
        return 'Dashboard';
      case 'Log':
        return 'LogWorkout';
      case 'History':
        return 'History';
      case 'Progress':
        return 'Progress';
      case 'Routines':
        return 'RoutinesScreen';
      default:
        return 'Dashboard';
    }
  };

  return (
    <Tab.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        swipeEnabled: true,
        tabBarStyle: { display: 'none' }, // hide top tabs UI
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="LogWorkout" component={LogWorkoutScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="RoutinesScreen" component={RoutinesScreen} />
    </Tab.Navigator>
  );
}
