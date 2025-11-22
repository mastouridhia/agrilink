import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Surface, Avatar, Title, Text, Divider, Searchbar } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { FirestoreConversation } from '../services/firebase';
import mockChatService from '../services/mockChatService';

interface ConversationListProps {
  conversations: FirestoreConversation[];
  currentUserId: string;
  onSelectConversation: (conversationId: string, participant: string) => void;
}

const ConversationList = ({
  conversations,
  currentUserId,
  onSelectConversation,
}: ConversationListProps) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [userDetails, setUserDetails] = useState<{[key: string]: any}>({});

  // Fetch user details for all participants
  useEffect(() => {
    const fetchUserDetails = async () => {
      const details: {[key: string]: any} = {};
      const uniqueUsers = new Set(
        conversations.flatMap(conv => 
          conv.participants.filter(id => id !== currentUserId)
        )
      );

      for (const userId of uniqueUsers) {
        const userData = await mockChatService.getUserDetails(userId);
        if (userData) {
          details[userId] = userData;
        }
      }

      setUserDetails(details);
    };

    fetchUserDetails();
  }, [conversations, currentUserId]);

  const getParticipantName = (conversation: FirestoreConversation) => {
    const participantId = conversation.participants.find(id => id !== currentUserId);
    if (!participantId) return 'Unknown';
    return userDetails[participantId]?.name || participantId;
  };

  const getParticipantAvatar = (conversation: FirestoreConversation) => {
    const participantId = conversation.participants.find(id => id !== currentUserId);
    if (!participantId) return null;
    return userDetails[participantId]?.avatar;
  };

  const getLastMessagePreview = (conversation: FirestoreConversation) => {
    if (!conversation.lastMessage) return '';
    const isOwnMessage = conversation.lastMessage.sender === currentUserId;
    return `${isOwnMessage ? 'You: ' : ''}${conversation.lastMessage.text}`;
  };

  const filteredConversations = conversations.filter(conv => {
    const participantName = getParticipantName(conv);
    return participantName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderConversationItem = ({ item }: { item: FirestoreConversation }) => {
    const participantId = item.participants.find(id => id !== currentUserId);
    if (!participantId) return null;

    const participantName = getParticipantName(item);
    const lastMessagePreview = getLastMessagePreview(item);
    const lastMessageTime = item.lastMessage?.timestamp.toDate().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        onPress={() => onSelectConversation(item.id, participantId)}
      >
        <Surface style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}>
          <Avatar.Icon 
            size={50} 
            icon="account"
          />
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Title style={styles.participantName}>{participantName}</Title>
              {lastMessageTime && (
                <Text style={styles.timestamp}>{lastMessageTime}</Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.lastMessage,
                !item.lastMessage?.read && styles.unreadMessage
              ]}
            >
              {lastMessagePreview}
            </Text>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search conversations"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.8,
  },
  unreadMessage: {
    fontWeight: 'bold',
    opacity: 1,
  },
});

export default ConversationList; 