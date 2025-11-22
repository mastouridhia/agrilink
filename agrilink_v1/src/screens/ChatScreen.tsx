import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Surface, Avatar, Title, Text, IconButton, Divider, Searchbar, Button, Portal, Modal, SegmentedButtons } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { FirestoreConversation, UserProfile, PlantGroup } from '../services/firebase';
import mockChatService from '../services/mockChatService';
import ConversationList from '../components/ConversationList';
import UserSearchList from '../components/UserSearchList';
import PlantGroupSwipePool from '../components/PlantGroupSwipePool';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../types/navigation';

type ChatScreenNavigationProp = StackNavigationProp<ChatStackParamList, 'ChatList'>;

interface ChatScreenProps {
  currentUserId: string;
}

const ChatScreen = ({ currentUserId }: ChatScreenProps) => {
  const { theme } = useTheme();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<FirestoreConversation[]>([]);
  const [userDetails, setUserDetails] = useState<{[key: string]: any}>({});
  const [selectedTab, setSelectedTab] = useState('direct');
  const [plantGroups, setPlantGroups] = useState<PlantGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<PlantGroup[]>([]);

  // Fetch conversations
  useEffect(() => {
    const unsubscribe = mockChatService.getUserConversations(
      currentUserId,
      (newConversations: FirestoreConversation[]) => {
        setConversations(newConversations);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // Fetch user details for all participants
  useEffect(() => {
    const fetchUserDetails = async () => {
      const details: {[key: string]: any} = {};
      const uniqueUsers = new Set(
        conversations.flatMap(conv => 
          conv.participants.filter(p => p !== currentUserId)
        )
      );

      for (const userId of uniqueUsers) {
        details[userId] = await mockChatService.getUserDetails(userId);
      }
      
      setUserDetails(details);
    };

    if (conversations.length > 0) {
      fetchUserDetails();
    }
  }, [conversations, currentUserId]);

  // Fetch plant groups
  useEffect(() => {
    const fetchPlantGroups = async () => {
      const groups = await mockChatService.getPlantGroups();
      setPlantGroups(groups.filter(group => !group.members.includes(currentUserId)));
    };
    fetchPlantGroups();
  }, [currentUserId]);

  // Fetch joined groups
  useEffect(() => {
    const unsubscribe = mockChatService.getUserGroups(currentUserId, (groups) => {
      setJoinedGroups(groups);
    });
    return () => unsubscribe();
  }, [currentUserId]);

  const handleSelectConversation = (conversationId: string, participantId: string) => {
    navigation.navigate('DirectMessage', {
      conversationId,
      participant: participantId
    });
  };

  const handleJoinGroup = async (groupId: string) => {
    await mockChatService.joinPlantGroup(groupId, currentUserId);
    navigation.navigate('GroupChat', { groupId });
  };

  const handleSkipGroup = (groupId: string) => {
    // Remove the group from the list
    setPlantGroups(groups => groups.filter(g => g.id !== groupId));
  };

  const renderContent = () => {
    if (selectedTab === 'direct') {
      return (
        <View style={styles.conversationListContainer}>
          {conversations.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No conversations yet. Start connecting with other farmers by joining plant groups!
              </Text>
            </View>
          ) : (
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
              onSelectConversation={handleSelectConversation}
            />
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.groupContainer}>
          {joinedGroups.length > 0 && (
            <View style={styles.joinedGroupsContainer}>
              <Title style={styles.sectionTitle}>Your Plant Groups</Title>
              <FlatList
                data={joinedGroups}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('GroupChat', { groupId: item.id })}
                  >
                    <Surface style={[styles.groupCard, { backgroundColor: theme.colors.surface }]}>
                      <Title>{item.name}</Title>
                      <Text>{item.memberCount} members</Text>
                    </Surface>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.joinedGroupsList}
              />
            </View>
          )}
          <View style={styles.swipePoolContainer}>
            <Title style={styles.sectionTitle}>Discover Plant Groups</Title>
            <PlantGroupSwipePool
              groups={plantGroups}
              onJoinGroup={handleJoinGroup}
              onSkipGroup={handleSkipGroup}
            />
          </View>
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SegmentedButtons
        value={selectedTab}
        onValueChange={setSelectedTab}
        buttons={[
          { value: 'direct', label: 'Direct Messages' },
          { value: 'groups', label: 'Plant Groups' },
        ]}
        style={styles.segmentedButtons}
      />
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  segmentedButtons: {
    margin: 16,
  },
  conversationListContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
  },
  groupContainer: {
    flex: 1,
  },
  joinedGroupsContainer: {
    paddingVertical: 16,
  },
  sectionTitle: {
    marginLeft: 16,
    marginBottom: 8,
  },
  joinedGroupsList: {
    paddingHorizontal: 16,
  },
  groupCard: {
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    width: 200,
  },
  swipePoolContainer: {
    flex: 1,
  },
});

export default ChatScreen; 