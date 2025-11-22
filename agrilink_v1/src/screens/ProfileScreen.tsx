import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Avatar, Button, Card, Divider, List, Surface, Switch, Text, Title, Badge, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';

const ProfileScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { profile, loading, error } = useProfile();
  const [isOnline, setIsOnline] = useState(true);
  const [showNearbyFarmers, setShowNearbyFarmers] = useState(false);
  const [contactPreferences, setContactPreferences] = useState({
    allowMessages: true,
    allowCalls: true,
    showLocation: true,
  });

  // Mock nearby farmers data
  const nearbyFarmers = [
    { id: 1, name: 'John Smith', distance: '2.5 km', isOnline: true },
    { id: 2, name: 'Maria Garcia', distance: '3.8 km', isOnline: false },
    { id: 3, name: 'David Lee', distance: '5.1 km', isOnline: true },
  ];

  const handleShareProfile = async () => {
    if (!profile) return;
    
    try {
      const result = await Share.share({
        message: `Check out my farm profile: ${profile.fullName} at ${profile.farmName}. 
        Location: ${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}`,
        title: 'Share Farm Profile',
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.error}>{error || 'Profile not found'}</Text>
        <Button mode="contained" onPress={signOut} style={styles.button}>
          Sign Out
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={80}
            label={profile?.fullName.split(' ').map(n => n[0]).join('')}
            style={styles.avatar}
          />
          <Badge
            visible={true}
            size={16}
            style={[
              styles.statusBadge,
              { backgroundColor: isOnline ? '#4CAF50' : '#757575' }
            ]}
          />
        </View>
        <Title style={[styles.name, { color: theme.colors.primary }]}>
          {profile?.fullName}
        </Title>
        <View style={styles.layerIconsContainer}>
          <View style={styles.layerIcon}>
            <MaterialCommunityIcons 
              name="check-decagram" 
              size={24} 
              color="#4CAF50"
            />
            <Text style={styles.layerText}>Verified</Text>
          </View>
          <View style={styles.layerIcon}>
            <MaterialCommunityIcons 
              name="star-circle" 
              size={24} 
              color="#FFC107"
            />
            <Text style={styles.layerText}>Expert Farmer</Text>
          </View>
          <View style={styles.layerIcon}>
            <MaterialCommunityIcons 
              name="clock-check" 
              size={24} 
              color="#2196F3"
            />
            <Text style={styles.layerText}>Active</Text>
          </View>
        </View>
        <Text style={{ color: theme.colors.onSurface }}>
          {profile?.farmName}
        </Text>
        {profile?.email && (
          <Text style={{ color: theme.colors.onSurface }}>
            {profile.email}
          </Text>
        )}
        <Button
          mode="contained"
          onPress={handleShareProfile}
          icon="share-variant"
          style={styles.shareButton}
        >
          Share Profile
        </Button>
      </Surface>

      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <Title style={{ color: theme.colors.primary }}>Contact Preferences</Title>
          <List.Item
            title="Allow Messages"
            right={() => (
              <Switch
                value={contactPreferences.allowMessages}
                onValueChange={(value) => 
                  setContactPreferences(prev => ({ ...prev, allowMessages: value }))}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Allow Calls"
            right={() => (
              <Switch
                value={contactPreferences.allowCalls}
                onValueChange={(value) => 
                  setContactPreferences(prev => ({ ...prev, allowCalls: value }))}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Show Location"
            right={() => (
              <Switch
                value={contactPreferences.showLocation}
                onValueChange={(value) => 
                  setContactPreferences(prev => ({ ...prev, showLocation: value }))}
                color={theme.colors.primary}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={{ color: theme.colors.primary }}>Nearby Farmers</Title>
            <Button
              mode="text"
              onPress={() => setShowNearbyFarmers(true)}
            >
              See All
            </Button>
          </View>
          {nearbyFarmers.slice(0, 2).map((farmer) => (
            <List.Item
              key={farmer.id}
              title={farmer.name}
              description={farmer.distance}
              left={props => (
                <View style={styles.farmerAvatar}>
                  <Avatar.Text
                    size={40}
                    label={farmer.name.split(' ').map(n => n[0]).join('')}
                  />
                  <Badge
                    visible={true}
                    size={12}
                    style={[
                      styles.miniStatusBadge,
                      { backgroundColor: farmer.isOnline ? '#4CAF50' : '#757575' }
                    ]}
                  />
                </View>
              )}
              right={props => (
                <MaterialCommunityIcons
                  name="message-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              )}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <Title style={{ color: theme.colors.primary }}>Farm Information</Title>
          <List.Item
            title="Location"
            description={`${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}`}
            left={props => <List.Icon {...props} icon="map-marker" />}
          />
          {profile.phoneNumber && (
            <List.Item
              title="Phone"
              description={profile.phoneNumber}
              left={props => <List.Icon {...props} icon="phone" />}
            />
          )}
          <Divider style={styles.divider} />
          <Title style={{ color: theme.colors.primary, fontSize: 16, marginTop: 8 }}>Crops</Title>
          {profile.selectedCrops && profile.selectedCrops.length > 0 ? (
            profile.selectedCrops.map((crop, index) => (
              <List.Item
                key={index}
                title={crop}
                left={props => <List.Icon {...props} icon="sprout" />}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No crops added yet
            </Text>
          )}
          {profile.experience && (
            <>
              <Divider style={styles.divider} />
              <List.Item
                title="Experience"
                description={profile.experience}
                left={props => <List.Icon {...props} icon="account-clock" />}
              />
            </>
          )}
          {profile.bio && (
            <>
              <Divider style={styles.divider} />
              <List.Item
                title="Bio"
                description={profile.bio}
                left={props => <List.Icon {...props} icon="card-text" />}
              />
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <Title style={{ color: theme.colors.primary }}>Settings</Title>
          <List.Item
            title="Dark Mode"
            right={() => (
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Notifications"
            right={() => (
              <Switch
                value={true}
                onValueChange={() => {/* TODO: Implement notifications toggle */}}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Language"
            description="English"
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {/* TODO: Implement language selection */}}
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => {/* TODO: Implement edit profile */}}
          icon="account-edit"
          style={styles.button}
        >
          Edit Profile
        </Button>
        <Button
          mode="outlined"
          onPress={signOut}
          icon="logout"
          style={styles.button}
        >
          Sign Out
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showNearbyFarmers}
          onDismiss={() => setShowNearbyFarmers(false)}
        >
          <Dialog.Title>Nearby Farmers</Dialog.Title>
          <Dialog.Content>
            {nearbyFarmers.map((farmer) => (
              <List.Item
                key={farmer.id}
                title={farmer.name}
                description={farmer.distance}
                left={props => (
                  <View style={styles.farmerAvatar}>
                    <Avatar.Text
                      size={40}
                      label={farmer.name.split(' ').map(n => n[0]).join('')}
                    />
                    <Badge
                      visible={true}
                      size={12}
                      style={[
                        styles.miniStatusBadge,
                        { backgroundColor: farmer.isOnline ? '#4CAF50' : '#757575' }
                      ]}
                    />
                  </View>
                )}
                right={props => (
                  <MaterialCommunityIcons
                    name="message-outline"
                    size={24}
                    color={theme.colors.primary}
                  />
                )}
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNearbyFarmers(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    marginBottom: 0,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  card: {
    margin: 16,
    elevation: 1,
  },
  divider: {
    marginVertical: 8,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
  shareButton: {
    marginTop: 16,
    borderRadius: 20,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  farmerAvatar: {
    position: 'relative',
  },
  miniStatusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  layerIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    gap: 16,
  },
  layerIcon: {
    alignItems: 'center',
    gap: 4,
  },
  layerText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ProfileScreen; 