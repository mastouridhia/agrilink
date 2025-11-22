import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

interface StoredUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    lastLoginAt: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // First try to get user from AsyncStorage
        const initAuth = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const userData = JSON.parse(storedUser) as StoredUser;
                    // User data loaded from storage
                }
            } catch (error) {
                // Error reading stored user - will fall back to Firebase auth
            }
        };

        initAuth();

        // Then listen for Firebase auth state changes
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);

            if (firebaseUser) {
                // Update stored user data
                try {
                    await AsyncStorage.setItem('user', JSON.stringify({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        lastLoginAt: new Date().toISOString()
                    }));
                } catch (error) {
                    console.error('Error storing user data:', error);
                }
            } else {
                // Clear stored user data
                try {
                    await AsyncStorage.removeItem('user');
                } catch (error) {
                    console.error('Error removing user data:', error);
                }
            }
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    return {
        user,
        loading,
        isAuthenticated: !!user,
    };
};

export default useAuth; 