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
        background: 'transparent',
        card: theme.colors.card,
        text: theme.colors.text,
        border: 'transparent',
        notification: theme.colors.primary,
        primary: theme.colors.primary,
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
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Tab.Navigator
          screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderRadius: 26,
            paddingBottom: 8,
            paddingTop: 12,
            height: 70,
            paddingHorizontal: 16,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.subtext,
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
      </View>
    </NavigationContainer>
  );
}
