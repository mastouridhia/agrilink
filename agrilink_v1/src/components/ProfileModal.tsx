import React from 'react';
import { View, StyleSheet, Modal, ScrollView } from 'react-native';
import { Surface, Avatar, Title, Text, IconButton, Button, Divider } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

// Default avatar URL from a reliable public source
const DEFAULT_AVATAR_URL = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  joinDate?: Date;
  isOnline?: boolean;
  interests?: string[];
  expertise?: string[];
  rating?: number;
  totalReviews?: number;
}

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const ProfileModal = ({ visible, onClose, profile }: ProfileModalProps) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
    >
      <View style={styles.modalOverlay}>
        <Surface style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.header}>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.profileHeader}>
              <Avatar.Image
                size={120}
                source={{ uri: profile.avatar || DEFAULT_AVATAR_URL }}
              />
              <View style={styles.onlineStatus}>
                <View style={[
                  styles.onlineIndicator,
                  { backgroundColor: profile.isOnline ? '#4CAF50' : '#757575' }
                ]} />
                <Text style={styles.onlineText}>
                  {profile.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              <Title style={styles.name}>{profile.name}</Title>
              {profile.location && (
                <View style={styles.locationContainer}>
                  <IconButton icon="map-marker" size={20} />
                  <Text>{profile.location}</Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            {profile.bio && (
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>About</Title>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            )}

            {profile.expertise && profile.expertise.length > 0 && (
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Expertise</Title>
                <View style={styles.tagContainer}>
                  {profile.expertise.map((item, index) => (
                    <Surface key={index} style={styles.tag}>
                      <Text>{item}</Text>
                    </Surface>
                  ))}
                </View>
              </View>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Interests</Title>
                <View style={styles.tagContainer}>
                  {profile.interests.map((item, index) => (
                    <Surface key={index} style={styles.tag}>
                      <Text>{item}</Text>
                    </Surface>
                  ))}
                </View>
              </View>
            )}

            {profile.rating && (
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Rating</Title>
                <View style={styles.ratingContainer}>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconButton
                        key={star}
                        icon={star <= profile.rating! ? 'star' : 'star-outline'}
                        size={24}
                        iconColor={star <= profile.rating! ? '#FFC107' : '#E0E0E0'}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviews}>
                    {profile.totalReviews} reviews
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Member Since</Title>
              <Text>
                {profile.joinDate?.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="account-plus"
                onPress={() => {/* TODO: Implement follow functionality */}}
                style={[styles.followButton, { width: '100%' }]}
              >
                Follow
              </Button>
            </View>
          </ScrollView>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    elevation: 5,
  },
  header: {
    alignItems: 'flex-end',
    padding: 8,
  },
  closeButton: {
    margin: 8,
  },
  scrollContent: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 14,
    opacity: 0.7,
  },
  name: {
    fontSize: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    padding: 8,
    borderRadius: 16,
    margin: 4,
    elevation: 1,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviews: {
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 24,
  },
  followButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default ProfileModal; 