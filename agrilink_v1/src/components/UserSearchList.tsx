import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Surface, Text, Avatar, Button, Chip, Title } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import mockChatService from '../services/mockChatService';

// Simple types for now - we'll expand these when we add Firebase
interface UserProfile {
  id: string;
  name: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  interests?: string[];
  expertise?: string[];
  isOnline?: boolean;
}

interface UserSearchListProps {
  currentUserId: string;
  onSelectUser: (user: UserProfile) => void;
}

const UserSearchList = ({ currentUserId, onSelectUser }: UserSearchListProps) => {
  const { theme } = useTheme();
  const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);
  const [similarInterestUsers, setSimilarInterestUsers] = useState<UserProfile[]>([]);
  const [currentUserDetails, setCurrentUserDetails] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      // Get current user details first
      const userDetails = await mockChatService.getUserDetails(currentUserId);
      setCurrentUserDetails(userDetails);

      const allUsers = await mockChatService.getAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== currentUserId);

      // Sort by distance if location available
      if (userDetails?.location) {
        const usersWithDistance = otherUsers.map(user => {
          if (user.location) {
            const distance = calculateDistance(
              userDetails.location.latitude,
              userDetails.location.longitude,
              user.location.latitude,
              user.location.longitude
            );
            return { ...user, distance };
          }
          return user;
        });
        
        const nearby = usersWithDistance
          .filter(user => user.distance !== undefined)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
          .slice(0, 5);
        
        setNearbyUsers(nearby);
      }

      // Find users with similar interests/crops
      if (userDetails?.interests || userDetails?.expertise) {
        const similar = otherUsers
          .map(user => {
            let matchScore = 0;
            
            // Match interests
            if (userDetails.interests && user.interests) {
              const matchingInterests = userDetails.interests.filter(
                interest => user.interests?.includes(interest)
              );
              matchScore += matchingInterests.length;
            }
            
            // Match expertise/crops
            if (userDetails.expertise && user.expertise) {
              const matchingExpertise = userDetails.expertise.filter(
                exp => user.expertise?.includes(exp)
              );
              matchScore += matchingExpertise.length;
            }
            
            return { ...user, matchScore };
          })
          .filter(user => user.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 5);
          
        setSimilarInterestUsers(similar);
      }
    };

    loadUsers();
  }, [currentUserId]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const renderUserItem = ({ item }: { item: UserProfile & { distance?: number, matchScore?: number } }) => (
    <Surface style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.userInfo}>
        <Avatar.Icon
          size={40}
          icon="account"
          color={item.isOnline ? theme.colors.primary : undefined}
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.distance !== undefined && (
            <Text style={styles.locationText}>{item.distance} km away</Text>
          )}
          {item.expertise && (
            <View style={styles.tagsContainer}>
              {item.expertise.slice(0, 2).map((exp, index) => (
                <Chip 
                  key={index} 
                  style={styles.tag} 
                  textStyle={styles.tagText}
                  icon="sprout"
                >
                  {exp}
                </Chip>
              ))}
            </View>
          )}
        </View>
      </View>
      <Button
        mode="contained"
        onPress={() => onSelectUser(item)}
        icon="message"
      >
        Message
      </Button>
    </Surface>
  );

  const renderSection = (title: string, data: UserProfile[]) => (
    data.length > 0 ? (
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>{title}</Title>
        <FlatList
          data={data}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
    ) : null
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            {renderSection('Farmers Near You', nearbyUsers)}
            {renderSection('Farmers with Similar Interests', similarInterestUsers)}
          </>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
  },
});

export default UserSearchList; 