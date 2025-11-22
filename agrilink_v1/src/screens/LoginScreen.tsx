import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface, Divider } from 'react-native-paper';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  Login: undefined;
  ProfileSetup: undefined;
  MainApp: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const auth = getAuth();
  const db = getFirestore();
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        // Check if user profile exists
        const userDoc = await getDoc(doc(db, 'farmers', userCredential.user.uid));
        if (userDoc.exists()) {
          navigation.navigate('MainApp');
        } else {
          navigation.navigate('ProfileSetup');
        }
      }
    } catch (error) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        // New users always go to profile setup
        navigation.navigate('ProfileSetup');
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Error creating account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInAnonymously(auth);
      if (userCredential.user) {
        // Create a basic profile for anonymous user
        const userDoc = await getDoc(doc(db, 'farmers', userCredential.user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'farmers', userCredential.user.uid), {
            fullName: 'Anonymous Farmer',
            farmName: 'Anonymous Farm',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isAnonymous: true
          });
        }
        navigation.navigate('MainApp');
      }
    } catch (error) {
      setError('Error signing in anonymously');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (error) {
      setError('Error signing in with Google');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface}>
        <Text variant="headlineMedium" style={styles.title}>AgriLink</Text>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          style={styles.button}
        >
          Login
        </Button>
        <Button
          mode="outlined"
          onPress={handleSignUp}
          loading={isLoading}
          style={styles.button}
        >
          Sign Up
        </Button>

        <Divider style={styles.divider} />
        
        <Button
          mode="outlined"
          onPress={handleGoogleSignIn}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="google" size={size} color="#DB4437" />
          )}
          style={styles.googleButton}
          loading={isLoading}
        >
          Sign in with Google
        </Button>

        <Divider style={styles.divider} />
        
        <Button
          mode="text"
          onPress={handleAnonymousLogin}
          loading={isLoading}
          style={styles.button}
        >
          Continue as Guest
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  googleButton: {
    marginTop: 10,
    borderColor: '#DB4437',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 20,
  },
});

export default LoginScreen; 