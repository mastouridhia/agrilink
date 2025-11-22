export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  region?: string;
}

export interface CropType {
  id: string;
  name: string;
  startDate?: Date;
  area?: number; // in hectares
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  location: Location;
  expertise: string[];
  crops: CropType[];
  equipment?: string[];
  rating?: number;
  totalRatings?: number;
  createdAt: Date;
  updatedAt: Date;
  // Advanced features
  yieldStats?: {
    [cropId: string]: {
      year: number;
      yield: number; // in tons/hectare
    }[];
  };
  contributionScore?: number;
} 