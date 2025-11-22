import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Surface, Text, IconButton, TextInput, Avatar, Title, Button } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ChatStackParamList } from '../types/navigation';
import { GroupMessage, PlantGroup } from '../services/firebase';
import mockChatService from '../services/mockChatService';

type GroupChatScreenNavigationProp = StackNavigationProp<ChatStackParamList, 'GroupChat'>;
type GroupChatScreenRouteProp = RouteProp<ChatStackParamList, 'GroupChat'>;

const GroupChatScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<GroupChatScreenNavigationProp>();
  const route = useRoute<GroupChatScreenRouteProp>();
  const { groupId } = route.params;
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [groupDetails, setGroupDetails] = useState<PlantGroup | null>(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      const groups = await mockChatService.getPlantGroups();
      const group = groups.find(g => g.id === groupId);
      if (group) {
        setGroupDetails(group);
      }
    };
    fetchGroupDetails();
  }, [groupId]);

  // Fetch messages
  useEffect(() => {
    const unsubscribe = mockChatService.getGroupMessages(
      groupId,
      (newMessages) => {
        setMessages(newMessages);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      await mockChatService.sendGroupMessage(groupId, message.trim(), 'currentUser');
      setMessage('');
    }
  };

  const handleLeaveGroup = async () => {
    await mockChatService.leavePlantGroup(groupId, 'currentUser');
    navigation.goBack();
  };

  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const isOwnMessage = item.sender === 'currentUser';

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={item.sender.substring(0, 2).toUpperCase()}
            style={styles.messageAvatar}
          />
        )}
        <Surface style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          { backgroundColor: isOwnMessage ? theme.colors.primary : theme.colors.surface }
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.sender}</Text>
          )}
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? theme.colors.surface : theme.colors.text }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isOwnMessage ? theme.colors.surface : theme.colors.text }
          ]}>
            {item.timestamp.toDate().toLocaleTimeString()}
          </Text>
        </Surface>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerInfo}>
            <Title>{groupDetails?.name}</Title>
            <Text>{groupDetails?.memberCount} members</Text>
          </View>
          <IconButton
            icon="information"
            size={24}
            onPress={() => setIsInfoModalVisible(true)}
          />
        </View>
      </Surface>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        inverted
      />

      <Surface style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          style={styles.input}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSendMessage}
              disabled={!message.trim()}
            />
          }
        />
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  messageList: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    padding: 8,
    marginVertical: 2,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    borderTopRightRadius: 4,
  },
  otherBubble: {
    borderTopLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    opacity: 0.7,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    padding: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
});

export default GroupChatScreen; 