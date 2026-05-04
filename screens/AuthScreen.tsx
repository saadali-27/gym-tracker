import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInUser, signUpUser } from '../services/supabase';
import { theme } from '../theme';
import { AppHeader, PrimaryButton, GhostButton } from '../components';

export default function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      const { error } = await signInUser(email, password);
      if (!error) {
        onAuth();
      } else {
        Alert.alert('Login Failed', error.message || 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      const { error } = await signUpUser(email, password);
      if (!error) {
        Alert.alert('Success', 'Account created successfully! You can now login.', [
          { text: 'OK', onPress: () => {} }
        ]);
      } else {
        Alert.alert('Signup Failed', error.message || 'Failed to create account. Please try again.');
      }
    } catch (error) {
      Alert.alert('Signup Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#9AA4B2"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#9AA4B2"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <PrimaryButton
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />

          <GhostButton
            title={loading ? 'Creating account...' : 'Sign Up'}
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    marginBottom: theme.spacing.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginTop: theme.spacing.sm,
  },
});
