import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen from '../screens/DashboardScreen';
import LogWorkoutScreen from '../screens/LogWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import RoutinesScreen from '../screens/RoutinesScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingBottom: 8,
            paddingTop: 8,
            height: 80,
          },
          headerStyle: {
            backgroundColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          headerTintColor: '#1a1a1a',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color, fontSize: size - 4, fontWeight: 'bold' }}>Home</Text>
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="LogWorkout"
        component={LogWorkoutScreen}
        options={{
          title: 'Log Workout',
          tabBarLabel: 'Log Workout',
          tabBarIcon: ({ color, size }) => (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color, fontSize: size - 2, fontWeight: 'bold' }}>+</Text>
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color, fontSize: size - 6, fontWeight: 'bold' }}>History</Text>
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Progress',
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color, fontSize: size - 6, fontWeight: 'bold' }}>Progress</Text>
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{
          title: 'Routines',
          tabBarLabel: 'Routines',
          tabBarIcon: ({ color, size }) => (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color, fontSize: size - 6, fontWeight: 'bold' }}>Routines</Text>
            </View>
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
    </NavigationContainer>
  );
}
