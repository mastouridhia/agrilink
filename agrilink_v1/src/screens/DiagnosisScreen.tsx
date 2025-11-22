import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Text, Surface, Title, Card, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { getDiagnosis } from '../services/plantDiagnosisService';

interface Disease {
  name: string;
  probability: number;
}

const DiagnosisScreen = () => {
  const { theme } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<Disease[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnosis = async (imageUri: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getDiagnosis(imageUri);
      if (result.is_healthy) {
        setDiagnosis([{
          name: 'Healthy Plant',
          probability: 1
        }]);
      } else {
        setDiagnosis(result.diseases);
      }
    } catch (err) {
      setError('Failed to get diagnosis. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      await handleDiagnosis(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need gallery permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      await handleDiagnosis(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Title style={{ color: theme.colors.primary }}>Plant Disease Diagnosis</Title>
      </Surface>

      <ScrollView style={styles.content}>
        {!image ? (
          <Card style={[styles.placeholderCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
                Take or upload a photo of your plant to get started
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.imageCard}>
            <Card.Cover source={{ uri: image }} style={styles.image} />
          </Card>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 10, color: theme.colors.onSurface }}>
              Analyzing your plant...
            </Text>
          </View>
        )}

        {error && (
          <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        {diagnosis && !isLoading && (
          <View style={styles.diagnosisContainer}>
            {diagnosis.map((disease, index) => (
              <Card key={index} style={[styles.diagnosisCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content style={styles.diseaseContent}>
                  <Text style={[styles.diseaseName, { color: theme.colors.onSurface }]}>
                    {disease.name}
                  </Text>
                  <Chip>
                    {Math.round(disease.probability * 100)}%
                  </Chip>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={takePicture}
            icon="camera"
            style={styles.button}
          >
            Take Photo
          </Button>
          <Button
            mode="outlined"
            onPress={pickImage}
            icon="image"
            style={styles.button}
          >
            Pick from Gallery
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    elevation: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  placeholderCard: {
    marginVertical: 20,
    padding: 20,
  },
  placeholderText: {
    textAlign: 'center',
    fontSize: 16,
  },
  imageCard: {
    marginVertical: 20,
  },
  image: {
    height: 300,
    resizeMode: 'cover',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  errorCard: {
    marginVertical: 20,
  },
  diagnosisContainer: {
    gap: 8,
  },
  diagnosisCard: {
    marginVertical: 6,
  },
  diseaseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    borderRadius: 8,
  },
});

export default DiagnosisScreen; 