import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  Timestamp,
  limit,
  arrayUnion,
  increment,
  arrayRemove,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../config/firebase';

// Use Firebase instances from centralized config
const db = getFirestore(app);
const storage = getStorage(app);

export interface FirestoreMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Timestamp;
  image?: string;
  conversationId: string;
  read: boolean;
}

export interface FirestoreConversation {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    sender: string;
    timestamp: Timestamp;
    read: boolean;
  };
  lastActive: Timestamp;
  createdAt: Timestamp;
  unreadCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  interests?: string[];
  expertise?: string[];
  isOnline?: boolean;
  lastActive?: Timestamp;
  avatar?: string;
  bio?: string;
}

export interface PlantGroup {
  id: string;
  name: string;
  plantType: string;
  memberCount: number;
  description: string;
  tags: string[];
  members: string[];
  createdAt: Timestamp;
  lastActive: Timestamp;
}

export interface GroupMessage extends FirestoreMessage {
  groupId: string;
}

export const chatService = {
  // Get all conversations for a user
  getUserConversations: (userId: string, callback: (conversations: FirestoreConversation[]) => void) => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastActive', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreConversation[];
      callback(conversations);
    });
  },

  // Get messages for a specific conversation
  getConversationMessages: (
    conversationId: string, 
    callback: (messages: FirestoreMessage[]) => void
  ) => {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreMessage[];
      callback(messages);
    });
  },

  // Send a new message
  sendMessage: async (
    conversationId: string,
    text: string,
    sender: string,
    image?: File
  ) => {
    let imageUrl;
    if (image) {
      const storageRef = ref(storage, `chat-images/${conversationId}/${Date.now()}`);
      await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(storageRef);
    }

    const messageData = {
      text,
      sender,
      timestamp: serverTimestamp(),
      conversationId,
      image: imageUrl,
      read: false,
    };

    const messageRef = await addDoc(collection(db, 'messages'), messageData);

    // Update conversation's last message and activity
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        text,
        sender,
        timestamp: serverTimestamp(),
      },
      lastActive: serverTimestamp(),
    });

    return messageRef.id;
  },

  // Create a new conversation
  createConversation: async (participants: string[]) => {
    const conversationData = {
      participants,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    };

    const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
    return conversationRef.id;
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId: string, userId: string) => {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('sender', '!=', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch: Promise<void>[] = [];
    
    snapshot.docs.forEach((doc) => {
      batch.push(updateDoc(doc.ref, { read: true }));
    });

    await Promise.all(batch);
  },

  // Get user details
  getUserDetails: async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    return userDoc.data();
  },

  // Search for users to chat with
  searchUsers: async (currentUserId: string, options: {
    maxDistance?: number; // in kilometers
    interests?: string[];
    expertise?: string[];
    limit?: number;
  } = {}) => {
    const { maxDistance = 50, limit: resultLimit = 20 } = options;
    
    // Get current user's details for comparison
    const currentUser = await chatService.getUserDetails(currentUserId) as UserProfile;
    if (!currentUser) return [];

    // Query all users except current user
    const usersQuery = query(
      collection(db, 'users'),
      where('id', '!=', currentUserId),
      limit(50) // Get more than limit to allow for filtering
    );

    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfile[];

    // Filter and sort users based on criteria
    const rankedUsers = users
      .map(user => {
        let score = 0;
        
        // Calculate distance if both users have location
        if (currentUser.location && user.location) {
          const distance = chatService.calculateDistance(
            currentUser.location.latitude,
            currentUser.location.longitude,
            user.location.latitude,
            user.location.longitude
          );
          
          // Add distance score (closer = higher score)
          if (distance <= maxDistance) {
            score += (maxDistance - distance) / maxDistance * 40; // Max 40 points for location
          }
        }

        // Add score for matching interests
        if (currentUser.interests && user.interests) {
          const matchingInterests = currentUser.interests.filter(
            interest => user.interests?.includes(interest)
          );
          score += (matchingInterests.length / currentUser.interests.length) * 30; // Max 30 points for interests
        }

        // Add score for matching expertise
        if (currentUser.expertise && user.expertise) {
          const matchingExpertise = currentUser.expertise.filter(
            exp => user.expertise?.includes(exp)
          );
          score += (matchingExpertise.length / currentUser.expertise.length) * 30; // Max 30 points for expertise
        }

        // Bonus points for online status
        if (user.isOnline) {
          score += 10; // 10 bonus points for being online
        }

        return { ...user, score };
      })
      .filter(user => user.score > 0) // Only include users with some matching criteria
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, resultLimit); // Take only the requested number of results

    return rankedUsers;
  },

  // Helper function to calculate distance between two points
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Get available plant groups
  getPlantGroups: async () => {
    const q = query(
      collection(db, 'plantGroups'),
      orderBy('lastActive', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PlantGroup[];
  },

  // Join a plant group
  joinPlantGroup: async (groupId: string, userId: string) => {
    const groupRef = doc(db, 'plantGroups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId),
      memberCount: increment(1)
    });
  },

  // Leave a plant group
  leavePlantGroup: async (groupId: string, userId: string) => {
    const groupRef = doc(db, 'plantGroups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      memberCount: increment(-1)
    });
  },

  // Get group messages
  getGroupMessages: (groupId: string, callback: (messages: GroupMessage[]) => void) => {
    const q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', groupId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GroupMessage[];
      callback(messages);
    });
  },

  // Send group message
  sendGroupMessage: async (groupId: string, text: string, sender: string) => {
    const messageData = {
      text,
      sender,
      timestamp: serverTimestamp(),
      groupId,
      read: false,
    };

    const messageRef = await addDoc(collection(db, 'groupMessages'), messageData);

    // Update group's last activity
    const groupRef = doc(db, 'plantGroups', groupId);
    await updateDoc(groupRef, {
      lastActive: serverTimestamp(),
    });

    return messageRef.id;
  },

  // Get user's joined groups
  getUserGroups: (userId: string, callback: (groups: PlantGroup[]) => void) => {
    const q = query(
      collection(db, 'plantGroups'),
      where('members', 'array-contains', userId),
      orderBy('lastActive', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlantGroup[];
      callback(groups);
    });
  },
};

// Helper function to convert degrees to radians
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default chatService; 