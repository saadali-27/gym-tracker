import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { LayoutDashboard, PlusSquare, Clock, TrendingUp, ListChecks } from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
import LogWorkoutScreen from '../screens/LogWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import RoutinesScreen from '../screens/RoutinesScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer theme={{
      dark: true,
      colors: {
        background: '#0A0F1E',
        card: '#121826',
        text: '#E6EAF2',
        border: '#1F2937',
        notification: '#4F8CFF',
        primary: '#4F8CFF',
      },
      fonts: {
        regular: {
          fontFamily: 'System',
          fontWeight: '400' as const,
        },
        medium: {
          fontFamily: 'System',
          fontWeight: '500' as const,
        },
        bold: {
          fontFamily: 'System',
          fontWeight: '700' as const,
        },
        heavy: {
          fontFamily: 'System',
          fontWeight: '800' as const,
        },
      }
    }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#7C9EFF',
          tabBarInactiveTintColor: '#7A8599',
          tabBarStyle: {
            backgroundColor: 'rgba(10,15,30,0.95)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.08)',
            height: 75,
            paddingBottom: 10,
            paddingTop: 10,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginBottom: 2,
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
              <LayoutDashboard size={24} strokeWidth={2} color={color} />
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
              <PlusSquare size={24} strokeWidth={2} color={color} />
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
              <Clock size={24} strokeWidth={2} color={color} />
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
              <TrendingUp size={24} strokeWidth={2} color={color} />
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
              <ListChecks size={24} strokeWidth={2} color={color} />
            </View>
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
    </NavigationContainer>
  );
}
