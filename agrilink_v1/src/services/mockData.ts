import { Timestamp } from 'firebase/firestore';

export const mockUsers = [
  {
    id: 'user1',
    name: 'John Farmer',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York Farm District'
    },
    interests: ['Organic Farming', 'Sustainable Agriculture', 'Crop Rotation'],
    expertise: ['Vegetable Growing', 'Irrigation Systems'],
    isOnline: true,
    lastActive: new Date(),
    bio: 'Experienced organic farmer with 10 years of experience'
  },
  {
    id: 'user2',
    name: 'Maria Garcia',
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      address: 'Los Angeles Agricultural Zone'
    },
    interests: ['Hydroponics', 'Urban Farming', 'Vertical Gardens'],
    expertise: ['Hydroponics', 'Urban Agriculture'],
    isOnline: true,
    lastActive: new Date(),
    bio: 'Urban farming specialist focusing on sustainable practices'
  },
  {
    id: 'user3',
    name: 'David Chen',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'San Francisco Green Belt'
    },
    interests: ['Smart Farming', 'Precision Agriculture', 'Soil Management'],
    expertise: ['Smart Irrigation', 'Soil Science'],
    isOnline: false,
    lastActive: new Date(),
    bio: 'Agricultural technology expert'
  },
  {
    id: 'user4',
    name: 'Sarah Johnson',
    location: {
      latitude: 41.8781,
      longitude: -87.6298,
      address: 'Chicago Rural District'
    },
    interests: ['Livestock Management', 'Organic Certification', 'Farm Planning'],
    expertise: ['Animal Husbandry', 'Organic Farming'],
    isOnline: true,
    lastActive: new Date(),
    bio: 'Specializing in organic livestock management'
  }
];

export const mockConversations = [
  {
    id: 'conv1',
    participants: ['currentUser', 'user1'],
    lastMessage: {
      text: 'How do you handle pest control in organic farming?',
      sender: 'currentUser',
      timestamp: Timestamp.fromDate(new Date()),
      read: true
    },
    lastActive: Timestamp.fromDate(new Date()),
    createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    unreadCount: 0
  },
  {
    id: 'conv2',
    participants: ['currentUser', 'user2'],
    lastMessage: {
      text: 'Would love to learn more about your hydroponic setup!',
      sender: 'user2',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
      read: false
    },
    lastActive: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
    unreadCount: 1
  },
  {
    id: 'conv3',
    participants: ['currentUser', 'user3'],
    lastMessage: {
      text: 'Check out this new smart irrigation system',
      sender: 'user3',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
      read: false
    },
    lastActive: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    unreadCount: 2
  }
];

export const mockMessages = {
  conv1: [
    {
      id: 'msg1',
      text: 'How do you handle pest control in organic farming?',
      sender: 'currentUser',
      timestamp: Timestamp.fromDate(new Date()),
      conversationId: 'conv1',
      read: true
    },
    {
      id: 'msg2',
      text: 'I use a combination of companion planting and natural predators',
      sender: 'user1',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)),
      conversationId: 'conv1',
      read: true
    }
  ],
  conv2: [
    {
      id: 'msg3',
      text: 'Would love to learn more about your hydroponic setup!',
      sender: 'user2',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
      conversationId: 'conv2',
      read: false
    }
  ],
  conv3: [
    {
      id: 'msg4',
      text: 'Check out this new smart irrigation system',
      sender: 'user3',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
      conversationId: 'conv3',
      read: false
    }
  ]
}; 