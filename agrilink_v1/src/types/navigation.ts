import { NavigatorScreenParams } from '@react-navigation/native';

export type ChatStackParamList = {
  ChatList: undefined;
  DirectMessage: {
    conversationId: string;
    participant: string;
  };
  GroupChat: {
    groupId: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Diagnosis: undefined;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  ProfileSetup: undefined;
  MainApp: NavigatorScreenParams<MainTabParamList> | undefined;
};