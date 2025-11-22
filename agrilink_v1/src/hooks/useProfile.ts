import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import * as ExpoLocation from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEYS = {
  CACHED_PROFILE: 'cachedProfile',
};

export interface FarmerProfile {
  uid: string;
  fullName: string;
  farmName: string;
  email?: string;
  phoneNumber?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  selectedCrops: string[];
  experience?: string;
  bio?: string;
  farmSize?: string;
  irrigationSystem?: string;
  region?: string;
  isAnonymous?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Network state management
  useEffect(() => {
    const handleNetworkChange = (state: any) => {
      setIsOnline(state.isConnected ?? false);
    };

    // Check initial network state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, []);

  const getCachedProfile = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_PROFILE);
      if (cachedData) {
        return JSON.parse(cachedData) as FarmerProfile;
      }
    } catch (err) {
      console.error('Error reading cached profile:', err);
    }
    return null;
  };

  const cacheProfile = async (profileData: FarmerProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(profileData));
    } catch (err) {
      console.error('Error caching profile:', err);
    }
  };

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      if (!isOnline) {
        const cachedProfile = await getCachedProfile();
        if (cachedProfile && cachedProfile.uid === user.uid) {
          setProfile(cachedProfile);
          setError(null);
          return;
        }
        throw new Error('No cached profile available offline');
      }

      const profileRef = doc(db, 'farmers', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as FarmerProfile;
        setProfile(profileData);
        setError(null);
        await cacheProfile(profileData);
      } else {
        // Don't automatically create a profile for guest users
        if (user.isAnonymous) {
          setProfile(null);
        } else {
          // For non-guest users, initialize with basic profile
          await initializeProfile(user.displayName || 'New User');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      console.error('Error fetching profile:', err);
      setError(message);
      
      const cachedProfile = await getCachedProfile();
      if (cachedProfile && cachedProfile.uid === user.uid) {
        setProfile(cachedProfile);
        setError('Using cached profile data (offline mode)');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<FarmerProfile>) => {
    if (!user) throw new Error('No authenticated user');
    
    try {
      if (!isOnline) {
        throw new Error('Cannot update profile while offline');
      }

      const profileRef = doc(db, 'farmers', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      let updatedProfile: FarmerProfile;
      
      if (profileSnap.exists()) {
        // Update existing profile
        const currentData = profileSnap.data() as FarmerProfile;
        updatedProfile = {
          ...currentData,
          ...data,
          updatedAt: new Date().toISOString()
        };
        await updateDoc(profileRef, updatedProfile as { [key: string]: any });
      } else {
        // Create new profile
        updatedProfile = {
          ...data,
          uid: user.uid,
          email: user.email || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as FarmerProfile;
        await setDoc(profileRef, updatedProfile as { [key: string]: any });
      }
      
      // Update local state and cache
      setProfile(updatedProfile);
      await cacheProfile(updatedProfile);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const initializeProfile = async (displayName: string) => {
    if (!user) throw new Error('No authenticated user');

    try {
      if (!isOnline) {
        throw new Error('Cannot initialize profile while offline');
      }

      // Request location permission
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current location
      const location = await ExpoLocation.getCurrentPositionAsync({});
      
      const newProfile: FarmerProfile = {
        uid: user.uid,
        fullName: displayName,
        farmName: '',
        email: user.email || undefined,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        selectedCrops: [],
        isAnonymous: user.isAnonymous,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const profileRef = doc(db, 'farmers', user.uid);
      await setDoc(profileRef, newProfile);
      
      setProfile(newProfile);
      await cacheProfile(newProfile);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to initialize profile');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user, isOnline]); // Re-fetch when user or network status changes

  return {
    profile,
    loading,
    error,
    isOnline,
    updateProfile,
    initializeProfile,
    refreshProfile: fetchProfile
  };
}; 