import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInUser, signUpUser } from '../services/supabase';

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

          <TouchableOpacity 
            style={[styles.button, styles.loginButton, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.text}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.signupButton, loading && styles.buttonDisabled]} 
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.text}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
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
    color: '#E6EAF2',
    fontSize: 28,
    marginBottom: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#121826',
    color: '#E6EAF2',
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#4F8CFF',
  },
  signupButton: {
    backgroundColor: '#22C55E',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
