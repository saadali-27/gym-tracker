import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { LayoutDashboard, PlusSquare, Clock, TrendingUp, ListChecks } from 'lucide-react-native';

import SwipeWrapper from '../components/SwipeWrapper';

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
          tabBarStyle: {
            backgroundColor: 'rgba(18, 24, 38, 0.9)',
            borderTopColor: 'rgba(31, 41, 55, 0.3)',
            borderTopWidth: 1,
            paddingBottom: 20,
            paddingTop: 12,
            height: 90,
            paddingHorizontal: 25,
            borderRadius: 25,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            position: 'absolute',
            bottom: 0,
            left: 10,
            right: 10,
          },
          tabBarActiveTintColor: '#4F8CFF',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={SwipeWrapper}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Log" 
          component={SwipeWrapper}
          options={{
            tabBarLabel: 'Log',
            tabBarIcon: ({ color, size }) => (
              <PlusSquare size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="History" 
          component={SwipeWrapper}
          options={{
            tabBarLabel: 'History',
            tabBarIcon: ({ color, size }) => (
              <Clock size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Progress" 
          component={SwipeWrapper}
          options={{
            tabBarLabel: 'Progress',
            tabBarIcon: ({ color, size }) => (
              <TrendingUp size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Routines" 
          component={SwipeWrapper}
          options={{
            tabBarLabel: 'Routines',
            tabBarIcon: ({ color, size }) => (
              <ListChecks size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
