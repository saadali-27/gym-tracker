import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { theme } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import LogWorkoutScreen from '../screens/LogWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import RoutinesScreen from '../screens/RoutinesScreen';

const Tab = createMaterialTopTabNavigator();

export default function TopTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        swipeEnabled: true,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
      />
      <Tab.Screen
        name="LogWorkout"
        component={LogWorkoutScreen}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
      />
    </Tab.Navigator>
  );
}
