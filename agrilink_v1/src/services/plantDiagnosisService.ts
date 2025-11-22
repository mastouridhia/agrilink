import { Platform } from 'react-native';

// Get API key from environment variables
const API_KEY = process.env.EXPO_PUBLIC_PLANT_ID_API_KEY || '';
const API_ENDPOINT = 'https://api.plant.id/v2/health_assessment';

if (!API_KEY) {
  console.warn('Plant.id API key is missing. Please set EXPO_PUBLIC_PLANT_ID_API_KEY in your .env file.');
}

interface DiagnosisResponse {
  is_healthy: boolean;
  diseases: Array<{
    name: string;
    probability: number;
  }>;
}

export const getDiagnosis = async (imageUri: string): Promise<DiagnosisResponse> => {
  try {
    // Convert image URI to base64
    let base64Image: string;
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          }
        };
        reader.readAsDataURL(blob);
      });
    } else {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          }
        };
        reader.readAsDataURL(blob);
      });
    }

    if (!API_KEY) {
      throw new Error('Plant.id API key is not configured. Please set EXPO_PUBLIC_PLANT_ID_API_KEY in your .env file.');
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': API_KEY,
      },
      body: JSON.stringify({
        images: [base64Image],
        modifiers: ["crops_fast", "similar_images"],
        language: "en"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to get diagnosis: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform API response to our interface
    return {
      is_healthy: data.health_assessment.is_healthy,
      diseases: data.health_assessment.diseases.map((disease: any) => ({
        name: disease.name,
        probability: disease.probability
      }))
    };
  } catch (error) {
    console.error('Error getting plant diagnosis:', error);
    throw error;
  }
}; 