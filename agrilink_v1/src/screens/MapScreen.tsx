import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import { useProfile } from '../hooks/useProfile';
import { ActivityIndicator, FAB, Portal, Modal, List, Switch, Text, Button, Avatar, Snackbar } from 'react-native-paper';
import * as ExpoLocation from 'expo-location';
import { db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, updateDoc, onSnapshot, query, where, GeoPoint, serverTimestamp, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Chat: { farmerId: string };
  Map: undefined;
  Profile: undefined;
  Home: undefined;
};

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

interface FarmerProfile {
  id: string;
  fullName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  isOrganic: boolean;
  selectedCrops: string[];
  lastUpdated?: number;
}

interface CropLayers {
  vegetables: boolean;
  fruits: boolean;
  grains: boolean;
}

interface MapLayers {
  showFarmers: boolean;
  showOrganicFarms: boolean;
  showCrops: CropLayers;
}

interface NearbyFarmer {
  id: string;
  name: string;
  isOnline: boolean;
  isOrganic: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  crops: string[];
  lastUpdated: number;
}

const NEARBY_RADIUS = 10000; // 10km in meters

const MapScreen = () => {
  const { theme } = useTheme();
  const { profile, loading: profileLoading, error: profileError } = useProfile() as { 
    profile: FarmerProfile | null;
    loading: boolean;
    error: any;
  };
  const navigation = useNavigation<MapScreenNavigationProp>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);
  const [nearbyFarmers, setNearbyFarmers] = useState<NearbyFarmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<NearbyFarmer | null>(null);
  
  const [layers, setLayers] = useState<MapLayers>({
    showFarmers: true,
    showOrganicFarms: true,
    showCrops: {
      vegetables: true,
      fruits: true,
      grains: true
    },
  });

  const [region, setRegion] = useState({
    latitude: 36.8065,
    longitude: 10.1815,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    map: {
      flex: 1,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    modal: {
      margin: 20,
      borderRadius: 8,
      padding: 20,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    farmerModal: {
      margin: 20,
      borderRadius: 8,
      padding: 20,
    },
    farmerHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    farmerName: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 12,
    },
    farmerDistance: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    chatButton: {
      marginTop: 20,
    },
    errorText: {
      textAlign: 'center',
      margin: 20,
      color: 'red',
    },
    errorButton: {
      margin: 20,
    },
    loadingText: {
      marginTop: 16,
      textAlign: 'center',
      color: theme.colors.primary,
    },
  });


  // Update user's location in Firebase with error handling
  const updateUserLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!profile?.id) return;

    try {
      const farmerRef = doc(db, 'farmers', profile.id);
      await updateDoc(farmerRef, {
        location: new GeoPoint(latitude, longitude),
        lastUpdated: serverTimestamp(),
        isOnline: true,
      });
    } catch (error) {
      console.error('Error updating location:', error);
      setError('Failed to update location. Please check your connection.');
    }
  }, [profile?.id]);

  // Handle location permission and setup
  useEffect(() => {
    let locationSubscription: any;
    let isMounted = true; // Add mounted check

    const setupLocation = async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        
        if (!isMounted) return; // Check if still mounted

        if (status !== 'granted') {
          setLocationPermissionDenied(true);
          setError('Location permission is required to use the map features.');
          setLoading(false); // Make sure to set loading to false
          return;
        }

        const location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });

        if (!isMounted) return; // Check if still mounted
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(newRegion);
        
        // Only update location in Firebase if we have a profile
        if (profile?.id) {
          await updateUserLocation(location.coords.latitude, location.coords.longitude);
        }

        // Subscribe to location updates
        locationSubscription = await ExpoLocation.watchPositionAsync(
          {
            accuracy: ExpoLocation.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location: ExpoLocation.LocationObject) => {
            if (profile?.id && isMounted) {
              updateUserLocation(location.coords.latitude, location.coords.longitude);
            }
          }
        );
      } catch (error: any) {
        if (isMounted) {
          setError('Failed to get location. Please check your device settings.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only setup location if profile is loaded and we're not already denied permission
    if (!profileLoading && !locationPermissionDenied) {
      setupLocation();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [profile?.id, profileLoading, locationPermissionDenied, updateUserLocation]);

  // Listen for nearby farmers with error handling
  useEffect(() => {
    if (!profile?.id || !region.latitude || !region.longitude) return;

    let unsubscribe: (() => void) | undefined;

    try {
      const farmersQuery = query(
        collection(db, 'farmers'),
        where('isOnline', '==', true)
      );

      unsubscribe = onSnapshot(
        farmersQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const farmers: NearbyFarmer[] = [];
          snapshot.forEach((doc: any) => {
            const data = doc.data();
            if (doc.id !== profile.id && data.location) {
              const distance = getDistanceFromLatLonInMeters(
                region.latitude,
                region.longitude,
                data.location.latitude,
                data.location.longitude
              );

              if (distance <= NEARBY_RADIUS) {
                farmers.push({
                  id: doc.id,
                  name: data.fullName || 'Unknown Farmer',
                  isOnline: true,
                  isOrganic: data.isOrganic || false,
                  location: {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                  },
                  crops: data.selectedCrops || [],
                  lastUpdated: data.lastUpdated?.toMillis() || Date.now(),
                });
              }
            }
          });
          setNearbyFarmers(farmers);
        },
        (error: Error) => {
          console.error('Error fetching nearby farmers:', error);
          setError('Failed to fetch nearby farmers. Please check your connection.');
        }
      );
    } catch (error) {
      console.error('Error setting up nearby farmers listener:', error);
      setError('Failed to initialize nearby farmers feature.');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [profile?.id, region]);

  const startChat = useCallback((farmerId: string) => {
    try {
      navigation.navigate('Chat', { farmerId });
      setSelectedFarmer(null);
    } catch (error) {
      console.error('Error navigating to chat:', error);
      setError('Failed to open chat. Please try again.');
    }
  }, [navigation]);

  // Calculate distance between two points in meters
  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handleMarkerPress = useCallback((farmer: NearbyFarmer) => {
    setSelectedFarmer(farmer);
  }, []);

  const toggleLayer = useCallback((layer: keyof MapLayers, subLayer?: keyof CropLayers) => {
    if (subLayer) {
      setLayers((prev: MapLayers) => ({
        ...prev,
        showCrops: {
          ...prev.showCrops,
          [subLayer]: !prev.showCrops[subLayer]
        }
      }));
    } else {
      setLayers((prev: MapLayers) => ({
        ...prev,
        [layer]: !prev[layer]
      }));
    }
  }, []);

  // Show error if profile failed to load
  if (profileError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorText}>
          Failed to load profile. Please try again.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          style={styles.errorButton}
        >
          Go to Home
        </Button>
      </View>
    );
  }

  // Show loading state with more information
  if (loading || profileLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>
          {profileLoading ? 'Loading profile...' : 'Setting up map...'}
        </Text>
      </View>
    );
  }

  // Show error message if location permission is denied
  if (locationPermissionDenied) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorText}>
          Location permission is required to use the map features.
          Please enable location services in your device settings.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          style={styles.errorButton}
        >
          Go to Home
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        <Circle
          center={region}
          radius={NEARBY_RADIUS}
          fillColor="rgba(0, 150, 255, 0.1)"
          strokeColor="rgba(0, 150, 255, 0.3)"
          strokeWidth={1}
        />

        {layers.showFarmers && nearbyFarmers
          .filter(farmer => !layers.showOrganicFarms || farmer.isOrganic)
          .map(farmer => (
            <Marker
              key={farmer.id}
              coordinate={farmer.location}
              title={farmer.name}
              description={`Crops: ${farmer.crops.join(', ')}`}
              pinColor={farmer.isOrganic ? 'green' : 'red'}
              onPress={() => handleMarkerPress(farmer)}
            />
          ))}
      </MapView>
      
      <FAB
        icon="layers"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowLayersModal(true)}
      />

      {/* Layers Modal */}
      <Portal>
        <Modal
          visible={showLayersModal}
          onDismiss={() => setShowLayersModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
    
          
          <List.Section>
            <List.Item
              title="Show All Farmers"
              right={() => (
                <Switch
                  value={layers.showFarmers}
                  onValueChange={() => toggleLayer('showFarmers')}
                />
              )}
            />
            <List.Item
              title="Organic Farms Only"
              right={() => (
                <Switch
                  value={layers.showOrganicFarms}
                  onValueChange={() => toggleLayer('showOrganicFarms')}
                />
              )}
            />
          </List.Section>

          <List.Section>
            <List.Subheader>Crop Types</List.Subheader>
            <List.Item
              title="Vegetables"
              right={() => (
                <Switch
                  value={layers.showCrops.vegetables}
                  onValueChange={() => toggleLayer('showCrops', 'vegetables')}
                />
              )}
            />
            <List.Item
              title="Fruits"
              right={() => (
                <Switch
                  value={layers.showCrops.fruits}
                  onValueChange={() => toggleLayer('showCrops', 'fruits')}
                />
              )}
            />
            <List.Item
              title="Grains"
              right={() => (
                <Switch
                  value={layers.showCrops.grains}
                  onValueChange={() => toggleLayer('showCrops', 'grains')}
                />
              )}
            />
          </List.Section>
        </Modal>

        {/* Selected Farmer Modal */}
        <Modal
          visible={!!selectedFarmer}
          onDismiss={() => setSelectedFarmer(null)}
          contentContainerStyle={[styles.farmerModal, { backgroundColor: theme.colors.background }]}
        >
          {selectedFarmer && (
            <View>
              <View style={styles.farmerHeader}>
                <Avatar.Text
                  size={60}
                  label={selectedFarmer.name.split(' ').map((n: string) => n[0]).join('')}
                />
                <Text style={[styles.farmerName, { color: theme.colors.primary }]}>
                  {selectedFarmer.name}
                </Text>
                <Text style={styles.farmerDistance}>
                  {(getDistanceFromLatLonInMeters(
                    region.latitude,
                    region.longitude,
                    selectedFarmer.location.latitude,
                    selectedFarmer.location.longitude
                  ) / 1000).toFixed(1)} km away
                </Text>
              </View>
              
              <List.Item
                title="Farm Type"
                description={selectedFarmer.isOrganic ? 'Organic Farm' : 'Conventional Farm'}
                left={(props: any) => <List.Icon {...props} icon={selectedFarmer.isOrganic ? 'leaf' : 'sprout'} />}
              />
              
              <List.Item
                title="Crops"
                description={selectedFarmer.crops.join(', ')}
                left={(props: any) => <List.Icon {...props} icon="grain" />}
              />

              <Button
                mode="contained"
                icon="chat"
                onPress={() => startChat(selectedFarmer.id)}
                style={styles.chatButton}
              >
                Start Chat
              </Button>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Dismiss',
          onPress: () => setError(null),
        }}
        duration={3000}
      >
        {error}
      </Snackbar>
    </View>
  );
};

export default MapScreen; 