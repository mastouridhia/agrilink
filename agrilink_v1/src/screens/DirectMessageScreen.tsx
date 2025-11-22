import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { TextInput, Surface, Avatar, Title, Text, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import chatService, { FirestoreMessage } from '../services/firebase';
import ProfileModal, { UserProfile } from '../components/ProfileModal';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../types/navigation';

type DirectMessageScreenNavigationProp = StackNavigationProp<ChatStackParamList, 'DirectMessage'>;
type DirectMessageScreenRouteProp = RouteProp<ChatStackParamList, 'DirectMessage'>;

const DirectMessageScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<DirectMessageScreenNavigationProp>();
  const route = useRoute<DirectMessageScreenRouteProp>();
  const { conversationId, participant } = route.params;
  
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [participantDetails, setParticipantDetails] = useState<UserProfile | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  
  // Fetch messages
  useEffect(() => {
    const unsubscribe = chatService.getConversationMessages(
      conversationId,
      (newMessages) => {
        setMessages(newMessages);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  // Fetch participant details
  useEffect(() => {
    const fetchParticipantDetails = async () => {
      try {
        const details = await chatService.getUserDetails(participant);
        if (details) {
          setParticipantDetails({
            id: participant,
            name: details.name || participant,
            email: details.email,
            bio: details.bio,
            avatar: details.avatar,
            location: details.location,
            joinDate: details.joinDate?.toDate(),
            isOnline: details.isOnline,
            interests: details.interests,
            expertise: details.expertise,
            rating: details.rating,
            totalReviews: details.totalReviews
          });
        } else {
          console.warn(`No details found for participant: ${participant}`);
          // Set minimal profile with just the ID and name
          setParticipantDetails({
            id: participant,
            name: participant
          });
        }
      } catch (error) {
        console.error('Error fetching participant details:', error);
        // Set minimal profile with just the ID and name
        setParticipantDetails({
          id: participant,
          name: participant
        });
      }
    };
    fetchParticipantDetails();
  }, [participant]);

  // Mark messages as read
  useEffect(() => {
    if (conversationId && participant) {
      chatService.markMessagesAsRead(conversationId, participant);
    }
  }, [conversationId, participant]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const sendMessage = async () => {
    if (message.trim() || selectedImage) {
      try {
        // Convert selected image to File object
        let imageFile;
        if (selectedImage) {
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        }

        await chatService.sendMessage(
          conversationId,
          message.trim(),
          participant,
          imageFile
        );

        setMessage('');
        setSelectedImage(null);
      } catch (error) {
        console.error('Error sending message:', error);
        // TODO: Show error message to user
      }
    }
  };

  const handleProfilePress = () => {
    setIsProfileModalVisible(true);
  };

  const renderMessage = ({ item }: { item: FirestoreMessage }) => {
    const isOwnMessage = item.sender === participant;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={participant.split(' ').map(n => n[0]).join('')}
            style={styles.avatar}
          />
        )}
        <View style={styles.messageContent}>
          {!isOwnMessage && (
            <Text style={[styles.sender, { color: theme.colors.primary }]}>
              {participant}
            </Text>
          )}
          <Surface style={[
            styles.messageBubble,
            isOwnMessage ? 
              { backgroundColor: theme.colors.primary } : 
              { backgroundColor: theme.colors.surfaceVariant }
          ]}>
            {item.text && (
              <Text style={{ 
                color: isOwnMessage ? theme.colors.surface : theme.colors.onSurface 
              }}>
                {item.text}
              </Text>
            )}
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            )}
          </Surface>
          <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
            {item.timestamp.toDate().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {isOwnMessage && (
              <Text style={styles.readStatus}>
                {item.read ? ' ✓✓' : ' ✓'}
              </Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <IconButton
              icon="arrow-left"
              size={28}
              onPress={() => navigation.goBack()}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <Avatar.Text
              size={48}
              label={participant.split(' ').map(n => n[0]).join('')}
            />
            <View style={styles.headerInfo}>
              <Title style={[styles.headerTitle, { color: theme.colors.primary }]}>
                {participant}
              </Title>
              <Text style={styles.headerSubtitle}>
                {participantDetails?.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => {/* TODO: Show more options */}}
            style={styles.moreButton}
          />
        </View>
      </Surface>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        inverted
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      <Surface style={[styles.inputWrapper, { backgroundColor: theme.colors.surface }]}>
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <IconButton
              icon="close"
              size={20}
              onPress={() => setSelectedImage(null)}
              style={styles.removeImageButton}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <IconButton
            icon="image"
            size={28}
            onPress={pickImage}
            style={styles.imageButton}
          />
          <IconButton
            icon="emoticon-outline"
            size={28}
            onPress={() => {/* TODO: Show emoji picker */}}
            style={styles.imageButton}
          />
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
            multiline
            maxLength={1000}
            right={
              <TextInput.Icon
                icon="send"
                size={28}
                onPress={sendMessage}
                disabled={!message.trim() && !selectedImage}
              />
            }
          />
        </View>
      </Surface>

      {participantDetails && (
        <ProfileModal
          visible={isProfileModalVisible}
          onClose={() => setIsProfileModalVisible(false)}
          profile={participantDetails}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 12,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  backButton: {
    marginRight: 12,
  },
  moreButton: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  ownMessage: {
    justifyContent: 'flex-end',
    paddingLeft: '15%',
  },
  otherMessage: {
    justifyContent: 'flex-start',
    paddingRight: '15%',
  },
  avatar: {
    marginRight: 12,
  },
  messageContent: {
    maxWidth: '85%',
  },
  sender: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    elevation: 1,
    maxWidth: '100%',
  },
  messageImage: {
    width: 280,
    height: 280,
    borderRadius: 12,
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    elevation: 0,
    maxHeight: 100,
    fontSize: 16,
    paddingVertical: 8,
  },
  imageButton: {
    marginRight: 8,
  },
  selectedImageContainer: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  readStatus: {
    marginLeft: 4,
    fontSize: 12,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

export default DirectMessageScreen; 