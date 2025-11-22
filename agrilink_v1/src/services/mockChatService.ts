import { mockUsers, mockConversations, mockMessages } from './mockData';
import { Timestamp } from 'firebase/firestore';
import { PlantGroup, GroupMessage } from './firebase';

// Mock plant groups data
const mockPlantGroups: PlantGroup[] = [
  {
    id: 'olives',
    name: 'Olive Farmers',
    plantType: 'Olives',
    memberCount: 45,
    description: 'Connect with olive farmers to share experiences and best practices in olive cultivation.',
    tags: ['Traditional', 'Oil Production', 'Mediterranean'],
    members: ['user1', 'user2'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'dates',
    name: 'Date Palm Community',
    plantType: 'Dates',
    memberCount: 38,
    description: 'A community for date palm growers to discuss cultivation techniques and market trends.',
    tags: ['Desert Agriculture', 'Palm Trees', 'Traditional'],
    members: ['user3', 'user4'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'citrus',
    name: 'Citrus Growers Network',
    plantType: 'Citrus',
    memberCount: 32,
    description: 'Share knowledge about growing oranges, lemons, and other citrus fruits.',
    tags: ['Fruit Trees', 'Organic', 'Disease Control'],
    members: ['user5', 'user6'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'wheat',
    name: 'Wheat Farmers United',
    plantType: 'Wheat',
    memberCount: 55,
    description: 'Discussion forum for wheat farmers to share cultivation practices and market insights.',
    tags: ['Cereals', 'Mechanized Farming', 'Large Scale'],
    members: ['user7', 'user8'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'barley',
    name: 'Barley Growers Hub',
    plantType: 'Barley',
    memberCount: 28,
    description: 'Connect with other barley farmers to discuss cultivation and market opportunities.',
    tags: ['Cereals', 'Drought Resistant', 'Feed Crops'],
    members: ['user9', 'user10'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'tomatoes',
    name: 'Tomato Growers Alliance',
    plantType: 'Tomatoes',
    memberCount: 42,
    description: 'Share experiences and tips about tomato cultivation, pest control, and marketing.',
    tags: ['Vegetables', 'Greenhouse', 'High Value'],
    members: ['user11', 'user12'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'peppers',
    name: 'Pepper Producers Circle',
    plantType: 'Peppers',
    memberCount: 35,
    description: 'Community for pepper farmers to discuss varieties, cultivation, and market trends.',
    tags: ['Vegetables', 'Spices', 'Export Crops'],
    members: ['user13', 'user14'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'grapes',
    name: 'Vineyard Network',
    plantType: 'Grapes',
    memberCount: 48,
    description: 'Connect with grape growers to share vineyard management practices and market insights.',
    tags: ['Fruit', 'Wine Production', 'Table Grapes'],
    members: ['user15', 'user16'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 32 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'almonds',
    name: 'Almond Growers Association',
    plantType: 'Almonds',
    memberCount: 30,
    description: 'Forum for almond farmers to discuss orchard management and processing techniques.',
    tags: ['Nuts', 'Tree Crops', 'High Value'],
    members: ['user17', 'user18'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'figs',
    name: 'Fig Farmers Community',
    plantType: 'Figs',
    memberCount: 25,
    description: 'Share knowledge about fig cultivation, harvesting, and marketing strategies.',
    tags: ['Fruit Trees', 'Traditional', 'Mediterranean'],
    members: ['user19', 'user20'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 38 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'pomegranates',
    name: 'Pomegranate Growers Network',
    plantType: 'Pomegranates',
    memberCount: 22,
    description: 'Community for pomegranate farmers to discuss cultivation and post-harvest handling.',
    tags: ['Fruit Trees', 'Antioxidant Rich', 'Export'],
    members: ['user21', 'user22'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 42 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'apricots',
    name: 'Apricot Farmers United',
    plantType: 'Apricots',
    memberCount: 28,
    description: 'Connect with other apricot growers to share experiences and market opportunities.',
    tags: ['Stone Fruit', 'Tree Management', 'Processing'],
    members: ['user23', 'user24'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  },
  {
    id: 'peaches',
    name: 'Peach Producers Hub',
    plantType: 'Peaches',
    memberCount: 32,
    description: 'Forum for peach farmers to discuss orchard care and fruit quality management.',
    tags: ['Stone Fruit', 'Fresh Market', 'Processing'],
    members: ['user25', 'user26'],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 49 * 24 * 60 * 60 * 1000)),
    lastActive: Timestamp.fromDate(new Date())
  }
];

// Mock group messages
const mockGroupMessages: { [key: string]: GroupMessage[] } = {
  olives: [
    {
      id: 'gmsg1',
      text: 'Anyone using traditional or mechanical harvesting methods this season?',
      sender: 'user1',
      timestamp: Timestamp.fromDate(new Date()),
      groupId: 'olives',
      read: true
    }
  ],
  dates: [
    {
      id: 'gmsg2',
      text: 'Tips for protecting date palms from extreme heat?',
      sender: 'user3',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
      groupId: 'dates',
      read: true
    }
  ],
  tomatoes: [
    {
      id: 'gmsg3',
      text: 'Best practices for greenhouse tomato cultivation?',
      sender: 'user11',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
      groupId: 'tomatoes',
      read: true
    }
  ]
};

export const mockChatService = {
  getUserConversations: (userId: string, callback: Function) => {
    // Simulate real-time updates
    callback(mockConversations);
    return () => {}; // Cleanup function
  },

  getConversationMessages: (conversationId: string, callback: Function) => {
    // Simulate real-time updates
    callback(mockMessages[conversationId] || []);
    return () => {}; // Cleanup function
  },

  sendMessage: async (conversationId: string, text: string, sender: string) => {
    const newMessage = {
      id: `msg${Date.now()}`,
      text,
      sender,
      timestamp: Timestamp.fromDate(new Date()),
      conversationId,
      read: false,
    };

    // Add message to mock data
    if (!mockMessages[conversationId]) {
      mockMessages[conversationId] = [];
    }
    mockMessages[conversationId].unshift(newMessage);

    // Update conversation last message
    const conversation = mockConversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.lastMessage = {
        text,
        sender,
        timestamp: Timestamp.fromDate(new Date()),
        read: false,
      };
      conversation.lastActive = Timestamp.fromDate(new Date());
    }

    return newMessage.id;
  },

  createConversation: async (participants: string[]) => {
    const newConversation = {
      id: `conv${Date.now()}`,
      participants,
      createdAt: Timestamp.fromDate(new Date()),
      lastActive: Timestamp.fromDate(new Date()),
      unreadCount: 0
    };

    mockConversations.push(newConversation);
    return newConversation.id;
  },

  markMessagesAsRead: async (conversationId: string, userId: string) => {
    const messages = mockMessages[conversationId] || [];
    messages.forEach(msg => {
      if (msg.sender !== userId) {
        msg.read = true;
      }
    });

    const conversation = mockConversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      if (conversation.lastMessage) {
        conversation.lastMessage.read = true;
      }
    }
  },

  getUserDetails: async (userId: string) => {
    return mockUsers.find(user => user.id === userId);
  },

  searchUsers: async (currentUserId: string, options: {
    maxDistance?: number;
    limit?: number;
  } = {}) => {
    const { maxDistance = 50, limit = 20 } = options;
    
    // Filter out current user and add random scores
    const users = mockUsers
      .filter(user => user.id !== currentUserId)
      .map(user => ({
        ...user,
        score: Math.random() * 100 // Random score for demo
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return users;
  },

  getAllUsers: async () => {
    return mockUsers;
  },

  // Get available plant groups
  getPlantGroups: async () => {
    return mockPlantGroups;
  },

  // Join a plant group
  joinPlantGroup: async (groupId: string, userId: string) => {
    const group = mockPlantGroups.find(g => g.id === groupId);
    if (group) {
      group.members.push(userId);
      group.memberCount += 1;
      group.lastActive = Timestamp.fromDate(new Date());
    }
  },

  // Leave a plant group
  leavePlantGroup: async (groupId: string, userId: string) => {
    const group = mockPlantGroups.find(g => g.id === groupId);
    if (group) {
      group.members = group.members.filter(id => id !== userId);
      group.memberCount -= 1;
      group.lastActive = Timestamp.fromDate(new Date());
    }
  },

  // Get user's joined groups
  getUserGroups: (userId: string, callback: (groups: PlantGroup[]) => void) => {
    const userGroups = mockPlantGroups.filter(group => group.members.includes(userId));
    callback(userGroups);
    return () => {}; // Cleanup function
  },

  // Get group messages
  getGroupMessages: (groupId: string, callback: (messages: GroupMessage[]) => void) => {
    callback(mockGroupMessages[groupId] || []);
    return () => {}; // Cleanup function
  },

  // Send group message
  sendGroupMessage: async (groupId: string, text: string, sender: string) => {
    const newMessage: GroupMessage = {
      id: `gmsg${Date.now()}`,
      text,
      sender,
      timestamp: Timestamp.fromDate(new Date()),
      groupId,
      read: true
    };

    if (!mockGroupMessages[groupId]) {
      mockGroupMessages[groupId] = [];
    }
    mockGroupMessages[groupId].unshift(newMessage);

    // Update group's last activity
    const group = mockPlantGroups.find(g => g.id === groupId);
    if (group) {
      group.lastActive = Timestamp.fromDate(new Date());
    }

    return newMessage.id;
  },
};

export default mockChatService; 