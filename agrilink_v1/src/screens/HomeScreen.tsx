import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Linking } from 'react-native';
import { Surface, Text, Avatar, Chip, Button, Card, ActivityIndicator, Divider } from 'react-native-paper';
import { getFirestore, collection, query, getDocs, where, GeoPoint } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

interface Farmer {
  id: string;
  fullName: string;
  farmName: string;
  selectedCrops: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  experience: string;
}

interface PlantInfo {
  id: number;
  common_name: string;
  scientific_name: string;
  cycle: string;
  watering: string;
  default_image: {
    regular_url: string;
  } | null;
  description: string;
}

const HomeScreen = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [plants, setPlants] = useState<PlantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [error, setError] = useState('');
  const [plantsError, setPlantsError] = useState('');
  const { user } = useAuth();
  const db = getFirestore();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchNearbyFarmers = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const farmersRef = collection(db, 'farmers');
      const farmersSnapshot = await getDocs(farmersRef);
      
      const nearbyFarmers = farmersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Farmer))
        .filter(farmer => farmer.id !== user?.uid)
        .map(farmer => ({
          ...farmer,
          distance: calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            farmer.location.latitude,
            farmer.location.longitude
          )
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 10); // Get 10 closest farmers

      setFarmers(nearbyFarmers);
    } catch (error) {
      setError('Error fetching nearby farmers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantInformation = async () => {
    try {
      setPlantsLoading(true);
      setPlantsError('');
      
      const apiKey = process.env.EXPO_PUBLIC_PERENUAL_API_KEY;
      if (!apiKey) {
        throw new Error('Perenual API key is not configured. Please set EXPO_PUBLIC_PERENUAL_API_KEY in your .env file.');
      }

      const apiUrl = 'https://perenual.com/api/species-list';
      const params = new URLSearchParams({
        key: apiKey,
        page: '2',
        indoor: '1'
      });
      
      const response = await fetch(`${apiUrl}?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid API response format');
      }

      const formattedPlants = data.data.map((plant: any) => ({
        id: plant.id,
        common_name: plant.common_name || 'Unknown Plant',
        scientific_name: plant.scientific_name || 'Scientific name not available',
        cycle: plant.cycle || 'Cycle not specified',
        watering: plant.watering || 'Watering needs not specified',
        default_image: plant.default_image || null,
        description: plant.description || 'No description available'
      }));

      setPlants(formattedPlants);
    } catch (error) {
      setPlantsError(error instanceof Error ? error.message : 'Error fetching plant information');
    } finally {
      setPlantsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyFarmers();
    fetchPlantInformation();
  }, []);

  const renderFarmerCard = ({ item }: { item: Farmer & { distance?: number } }) => (
    <Surface style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar.Text 
          size={50} 
          label={item.fullName.split(' ').map(n => n[0]).join('')} 
        />
        <View style={styles.farmerInfo}>
          <Text variant="titleMedium">{item.fullName}</Text>
          <Text variant="bodyMedium">{item.farmName}</Text>
          {item.distance && (
            <Text variant="bodySmall">{item.distance.toFixed(1)} km away</Text>
          )}
        </View>
      </View>

      <View style={styles.cropsContainer}>
        {item.selectedCrops.map((crop) => (
          <Chip key={crop} style={styles.chip}>
            {crop}
          </Chip>
        ))}
      </View>

      <View style={styles.cardActions}>
        <Button 
          mode="contained" 
          onPress={() => {/* Navigate to chat */}}
          icon="chat"
        >
          Message
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => {/* Navigate to profile */}}
          icon="account"
        >
          View Profile
        </Button>
      </View>
    </Surface>
  );

  const renderPlantCard = ({ item }: { item: PlantInfo }) => {
    const handlePlantPress = () => {
      const searchQuery = `${item.common_name} ${item.scientific_name} plant`;
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      Linking.openURL(googleUrl);
    };

    return (
      <Card style={styles.plantCard} onPress={handlePlantPress}>
        {item.default_image?.regular_url ? (
          <Card.Cover 
            source={{ uri: item.default_image.regular_url }} 
            style={styles.plantImage}
          />
        ) : (
          <Card.Cover 
            source={{ uri: 'https://via.placeholder.com/300x200?text=No+Plant+Image' }} 
            style={styles.plantImage}
          />
        )}
        <Card.Content>
          <Text variant="titleLarge" style={styles.plantTitle}>{item.common_name}</Text>
          <Text variant="titleSmall" style={styles.scientificName}>{item.scientific_name}</Text>
          <View style={styles.plantDetails}>
            <Chip icon="water" style={styles.detailChip}>{item.watering}</Chip>
            <Chip icon="sprout" style={styles.detailChip}>{item.cycle}</Chip>
          </View>
          <Text variant="bodySmall" style={styles.tapInfo}>Tap to search on Google</Text>
        </Card.Content>
      </Card>
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge" style={styles.error}>{error}</Text>
        <Button mode="contained" onPress={fetchNearbyFarmers}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Plant Information</Text>
      {plantsLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : plantsError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{plantsError}</Text>
          <Button mode="contained" onPress={fetchPlantInformation}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={plants}
          renderItem={renderPlantCard}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.plantsList}
        />
      )}

      <Divider style={styles.divider} />

      <Text variant="headlineMedium" style={styles.title}>Nearby Farmers</Text>
      <FlatList
        data={farmers}
        renderItem={renderFarmerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchNearbyFarmers}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  farmerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cropsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  plantCard: {
    width: 350,
    marginRight: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#fff',
  },
  plantImage: {
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  plantTitle: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  scientificName: {
    fontStyle: 'italic',
    marginBottom: 12,
    opacity: 0.7,
  },
  plantDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailChip: {
    height: 32,
  },
  tapInfo: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 4,
    fontStyle: 'italic',
  },
  plantsList: {
    marginBottom: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  loader: {
    marginVertical: 20,
  },
  divider: {
    marginVertical: 16,
  },
});

export default HomeScreen; 