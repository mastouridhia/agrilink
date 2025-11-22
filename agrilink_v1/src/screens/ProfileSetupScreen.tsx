import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextStyle, ViewStyle, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface, Chip, ProgressBar, Snackbar, useTheme } from 'react-native-paper';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { auth, db, toggleNetworkAccess } from '../config/firebase';
import { useProfile, FarmerProfile } from '../hooks/useProfile';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Define styles inline for now since the styles module is missing
type Styles = {
  container: ViewStyle;
  surface: ViewStyle;
  input: ViewStyle;
  chipContainer: ViewStyle;
  chip: ViewStyle;
  error: TextStyle;
  title: TextStyle;
  button: ViewStyle;
  cropContainer: ViewStyle;
  sectionTitle: TextStyle;
  submitButton: ViewStyle;
  sliderContainer: ViewStyle;
  slider: ViewStyle;
  sliderLabel: TextStyle;
  sliderHint: TextStyle;
  offlineWarning: TextStyle;
  snackbar: ViewStyle;
  fieldError: TextStyle;
  errorButton: ViewStyle;
  errorContainer: ViewStyle;
  locationText: TextStyle;
  inputLabel: TextStyle;
  guestWarning: TextStyle;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  surface: {
    padding: 16,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    padding: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  fieldError: {
    color: 'red',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  title: {
    marginBottom: 24,
  },
  button: {
    marginVertical: 16,
  },
  errorButton: {
    backgroundColor: '#ffebee',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  locationText: {
    marginBottom: 16,
  },
  offlineWarning: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
  },
  submitButton: {
    marginTop: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  slider: {
    flex: 1,
    height: 8,
    marginHorizontal: 8,
    borderRadius: 4,
  },
  sliderLabel: {
    minWidth: 30,
    textAlign: 'center',
  },
  sliderHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  guestWarning: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
});

const CROP_TYPES = [
  'Olives', 'Dates', 'Citrus', 'Wheat', 'Barley',
  'Tomatoes', 'Peppers', 'Grapes', 'Almonds', 'Figs',
  'Pomegranates', 'Apricots', 'Peaches'
];

const TUNISIAN_REGIONS = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul',
  'Zaghouan', 'Bizerte', 'Béja', 'Jendouba', 'Le Kef',
  'Siliana', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
  'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Gafsa',
  'Tozeur', 'Kebili', 'Gabès', 'Medenine', 'Tataouine'
];

const IRRIGATION_SYSTEMS = [
  'Drip Irrigation',
  'Sprinkler System',
  'Surface Irrigation',
  'Center Pivot',
  'Traditional Flooding',
  'Micro-Irrigation',
  'None'
];

interface FormData {
  fullName: string;
  farmName: string;
  phoneNumber: string;
  location: { latitude: number; longitude: number; } | undefined;
  selectedCrops: string[];
  experience: string;
  bio: string;
  farmSize: string;
  irrigationSystem: string;
  region: string;
}

interface ValidationErrors {
  fullName: boolean;
  farmName: boolean;
  region: boolean;
  location: boolean;
}

const STORAGE_KEYS = {
  FORM_DATA: 'profileSetupFormData',
  PENDING_PROFILES: 'pendingProfiles',
};

const FARM_SIZE_RANGES = [
  { label: '< 1', value: '< 1', max: 1 },
  { label: '1-5', value: '1-5', max: 5 },
  { label: '5-10', value: '5-10', max: 10 },
  { label: '10-50', value: '10-50', max: 50 },
  { label: '50-100', value: '50-100', max: 100 },
  { label: '> 100', value: '> 100', max: 999 }
];

const EXPERIENCE_RANGES = [
  { label: '< 1 year', value: '< 1' },
  { label: '1-3 years', value: '1-3' },
  { label: '3-5 years', value: '3-5' },
  { label: '5-10 years', value: '5-10' },
  { label: '10-20 years', value: '10-20' },
  { label: '> 20 years', value: '> 20' }
];

const ProfileSetupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    farmName: '',
    phoneNumber: '',
    location: undefined,
    selectedCrops: [],
    experience: '< 1',
    bio: '',
    farmSize: '< 1',
    irrigationSystem: '',
    region: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    fullName: false,
    farmName: false,
    region: false,
    location: false
  });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const { updateProfile: updateUserProfile } = useProfile();
  const theme = useTheme();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Try to load saved form data first
        const savedData = await AsyncStorage.getItem(STORAGE_KEYS.FORM_DATA);
        if (savedData) {
          setFormData(JSON.parse(savedData));
          return;
        }

        // If no saved data and user exists, pre-fill some fields
        if (user) {
          setFormData(prev => ({
            ...prev,
            fullName: user.displayName || '',
            phoneNumber: user.phoneNumber || '',
          }));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [user]);

  // Save form data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveFormData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formData));
      } catch (error) {
        // Error saving form data - non-critical, will retry on next change
      }
    };
    saveFormData();
  }, [formData]);

  // Handle offline data sync
  useEffect(() => {
    const syncPendingProfiles = async () => {
      if (isOnline) {
        try {
          const pendingProfiles = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_PROFILES);
          if (pendingProfiles) {
            const profiles = JSON.parse(pendingProfiles);
            
            // Use Promise.allSettled to handle partial success
            const results = await Promise.allSettled(
              profiles.map((profile: Partial<FarmerProfile>) => updateUserProfile(profile))
            );

            // Check results and handle any failures
            const failedProfiles = profiles.filter((_: Partial<FarmerProfile>, index: number) => 
              results[index].status === 'rejected'
            );

            if (failedProfiles.length > 0) {
              // Save back failed profiles
              await AsyncStorage.setItem(
                STORAGE_KEYS.PENDING_PROFILES, 
                JSON.stringify(failedProfiles)
              );
              setSnackbarMessage(`${profiles.length - failedProfiles.length} profiles synced, ${failedProfiles.length} failed`);
            } else {
              // All succeeded, clear storage
              await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PROFILES);
              setSnackbarMessage('All pending profiles synced successfully');
            }
            setShowSnackbar(true);
          }
        } catch (error) {
          console.error('Error syncing pending profiles:', error);
          setSnackbarMessage('Failed to sync some profiles. Will retry when connection improves.');
          setShowSnackbar(true);
        }
      }
    };

    syncPendingProfiles();
  }, [isOnline]);

  // Network state management
  useEffect(() => {
    const handleNetworkChange = async (state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      setIsOnline(isConnected);
      
      try {
        await toggleNetworkAccess(isConnected);
        if (isConnected) {
          setSnackbarMessage('Back online. Your profile will be synced.');
        } else {
          setSnackbarMessage('You are offline. Changes will be saved locally.');
        }
        setShowSnackbar(true);
      } catch (error) {
        console.error('Error handling network change:', error);
      }
    };

    // Check initial network state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, []);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      fullName: !formData.fullName.trim(),
      farmName: !formData.farmName.trim(),
      region: !formData.region.trim(),
      location: !formData.location
    };

    setValidationErrors(errors);
    setHasAttemptedSubmit(true);

    return !Object.values(errors).some(error => error);
  };

  const handleLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to continue');
        setValidationErrors(prev => ({ ...prev, location: true }));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setFormData(prev => ({
        ...prev,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      }));
      setValidationErrors(prev => ({ ...prev, location: false }));
    } catch (error) {
      setError('Error getting location. Please try again.');
      setValidationErrors(prev => ({ ...prev, location: true }));
    }
  };

  const handleFarmSizeSelect = (value: string) => {
    setFormData(prev => ({ ...prev, farmSize: value }));
  };

  const handleExperienceSelect = (value: string) => {
    setFormData(prev => ({ ...prev, experience: value }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!validateForm()) {
      setError('Please fill in all required fields marked in red');
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const profileData: Partial<FarmerProfile> = {
        uid: currentUser.uid,
        fullName: formData.fullName.trim(),
        farmName: formData.farmName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        location: formData.location,
        selectedCrops: formData.selectedCrops,
        experience: formData.experience,
        bio: formData.bio?.trim(),
        farmSize: formData.farmSize,
        irrigationSystem: formData.irrigationSystem,
        region: formData.region,
        isAnonymous: currentUser.isAnonymous,
        email: currentUser.email || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const networkState = await NetInfo.fetch();
      const isCurrentlyOnline = networkState.isConnected ?? false;

      if (isCurrentlyOnline) {
        try {
          await updateUserProfile(profileData);
          await AsyncStorage.removeItem(STORAGE_KEYS.FORM_DATA);
          setSnackbarMessage('Profile updated successfully!');
          setShowSnackbar(true);
          navigation.navigate('MainApp', { screen: 'Home' });
        } catch (error) {
          console.error('Error updating profile online:', error);
          await handleOfflineStorage(profileData);
        }
      } else {
        await handleOfflineStorage(profileData);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Unable to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineStorage = async (profileData: Partial<FarmerProfile>) => {
    try {
      const pendingProfiles = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_PROFILES);
      let profiles = [];
      
      if (pendingProfiles) {
        profiles = JSON.parse(pendingProfiles);
        const existingIndex = profiles.findIndex((p: any) => p.uid === profileData.uid);
        if (existingIndex !== -1) {
          profiles[existingIndex] = profileData;
        } else {
          profiles.push(profileData);
        }
      } else {
        profiles = [profileData];
      }

      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PROFILES, JSON.stringify(profiles));
      await AsyncStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formData));
      
      setSnackbarMessage('Profile saved offline. Will sync when online.');
      setShowSnackbar(true);
      
      navigation.navigate('MainApp', { screen: 'Home' });
    } catch (storageError) {
      console.error('Error saving to offline storage:', storageError);
      setError('Failed to save offline. Please check your device storage.');
      throw storageError;
    }
  };

  const getInputStyle = (fieldName: keyof ValidationErrors) => {
    return [
      styles.input,
      hasAttemptedSubmit && validationErrors[fieldName] && styles.errorContainer
    ];
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.surface}>
        {user?.isAnonymous && (
          <Text style={styles.guestWarning}>
            ⚠️ You are setting up a guest profile. Your data will be lost if you log out.
            Consider creating a full account to save your information permanently.
          </Text>
        )}

        {!isOnline && (
          <Text style={styles.offlineWarning}>
            ⚠️ You are offline. Your changes will be saved locally and synced when online.
          </Text>
        )}
        
        <Text variant="headlineSmall" style={styles.title}>Complete Your Profile</Text>
        
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <TextInput
          label="Full Name *"
          value={formData.fullName}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, fullName: text }));
            if (hasAttemptedSubmit) {
              setValidationErrors(prev => ({ ...prev, fullName: !text.trim() }));
            }
          }}
          mode="outlined"
          style={getInputStyle('fullName')}
          error={hasAttemptedSubmit && validationErrors.fullName}
        />
        {hasAttemptedSubmit && validationErrors.fullName && (
          <Text style={styles.fieldError}>Full Name is required</Text>
        )}

        <TextInput
          label="Farm Name *"
          value={formData.farmName}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, farmName: text }));
            if (hasAttemptedSubmit) {
              setValidationErrors(prev => ({ ...prev, farmName: !text.trim() }));
            }
          }}
          mode="outlined"
          style={getInputStyle('farmName')}
          error={hasAttemptedSubmit && validationErrors.farmName}
        />
        {hasAttemptedSubmit && validationErrors.farmName && (
          <Text style={styles.fieldError}>Farm Name is required</Text>
        )}

        <View style={styles.input}>
          <Text>Region in Tunisia *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[
            styles.chipContainer,
            hasAttemptedSubmit && validationErrors.region && styles.errorContainer
          ]}>
            {TUNISIAN_REGIONS.map((region) => (
              <Chip
                key={region}
                selected={formData.region === region}
                onPress={() => {
                  setFormData(prev => ({ ...prev, region }));
                  setValidationErrors(prev => ({ ...prev, region: false }));
                }}
                style={styles.chip}
              >
                {region}
              </Chip>
            ))}
          </ScrollView>
          {hasAttemptedSubmit && validationErrors.region && (
            <Text style={styles.fieldError}>Please select a region</Text>
          )}
        </View>

        <TextInput
          label="Phone Number"
          value={formData.phoneNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
          disabled={isLoading}
        />

        <Button
          mode="contained"
          onPress={handleLocationPermission}
          style={[
            styles.button,
            hasAttemptedSubmit && validationErrors.location && styles.errorButton
          ]}
        >
          {formData.location ? 'Update Location' : 'Get Location *'}
        </Button>

        {formData.location && (
          <Text style={styles.locationText}>
            Location: {formData.location.latitude.toFixed(4)}, {formData.location.longitude.toFixed(4)}
          </Text>
        )}
        {hasAttemptedSubmit && validationErrors.location && (
          <Text style={styles.fieldError}>Location is required</Text>
        )}

        <View style={styles.input}>
          <Text style={styles.title}>Select Your Crops</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {CROP_TYPES.map((crop) => (
              <Chip
                key={crop}
                selected={formData.selectedCrops.includes(crop)}
                onPress={() => {
                  const newCrops = formData.selectedCrops.includes(crop)
                    ? formData.selectedCrops.filter(c => c !== crop)
                    : [...formData.selectedCrops, crop];
                  setFormData(prev => ({ ...prev, selectedCrops: newCrops }));
                }}
                style={styles.chip}
              >
                {crop}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.input}>
          <Text style={styles.inputLabel}>Farm Size (Hectares) *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.chipContainer}
          >
            {FARM_SIZE_RANGES.map((range) => (
              <Chip
                key={range.value}
                selected={formData.farmSize === range.value}
                onPress={() => handleFarmSizeSelect(range.value)}
                style={styles.chip}
                mode={formData.farmSize === range.value ? 'flat' : 'outlined'}
              >
                {range.label} ha
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.input}>
          <Text style={styles.inputLabel}>Years of Experience *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.chipContainer}
          >
            {EXPERIENCE_RANGES.map((range) => (
              <Chip
                key={range.value}
                selected={formData.experience === range.value}
                onPress={() => handleExperienceSelect(range.value)}
                style={styles.chip}
                mode={formData.experience === range.value ? 'flat' : 'outlined'}
              >
                {range.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <TextInput
          label="Bio"
          value={formData.bio}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Tell us about your farming experience and specialties..."
          disabled={isLoading}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={isLoading}
        >
          {isLoading 
            ? 'Saving Profile...' 
            : isOnline 
              ? 'Complete Profile Setup' 
              : 'Save Profile Offline'}
        </Button>
      </Surface>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

export default ProfileSetupScreen; 