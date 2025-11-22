import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Surface, Text, Title, Chip, Button } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

interface PlantGroup {
  id: string;
  name: string;
  plantType: string;
  memberCount: number;
  description: string;
  tags: string[];
}

interface PlantGroupSwipePoolProps {
  groups: PlantGroup[];
  onJoinGroup: (groupId: string) => void;
  onSkipGroup: (groupId: string) => void;
}

const PlantGroupSwipePool = ({ groups, onJoinGroup, onSkipGroup }: PlantGroupSwipePoolProps) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = new Animated.ValueXY();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        forceSwipe('right');
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        forceSwipe('left');
      } else {
        resetPosition();
      }
    }
  });

  const forceSwipe = (direction: 'right' | 'left') => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'right' | 'left') => {
    const group = groups[currentIndex];
    if (direction === 'right') {
      onJoinGroup(group.id);
    } else {
      onSkipGroup(group.id);
    }
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-120deg', '0deg', '120deg']
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  };

  const renderCard = (group: PlantGroup) => {
    return (
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Title style={styles.groupName}>{group.name}</Title>
        <Text style={styles.plantType}>{group.plantType}</Text>
        <Text style={styles.description}>{group.description}</Text>
        <View style={styles.memberCount}>
          <Text>{group.memberCount} members</Text>
        </View>
        <View style={styles.tagsContainer}>
          {group.tags.map((tag, index) => (
            <Chip key={index} style={styles.tag} icon="sprout">
              {tag}
            </Chip>
          ))}
        </View>
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => onJoinGroup(group.id)}
            style={[styles.joinButton, { backgroundColor: theme.colors.primary }]}
          >
            Join Group
          </Button>
        </View>
      </Surface>
    );
  };

  if (currentIndex >= groups.length) {
    return (
      <View style={styles.noMoreCards}>
        <Text>No more plant groups to show!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groups.map((group, index) => {
        if (index < currentIndex) return null;
        if (index === currentIndex) {
          return (
            <Animated.View
              key={group.id}
              style={[getCardStyle(), styles.cardContainer]}
              {...panResponder.panHandlers}
            >
              {renderCard(group)}
            </Animated.View>
          );
        }
        return (
          <View
            key={group.id}
            style={[styles.cardContainer, { top: 10 * (index - currentIndex) }]}
          >
            {renderCard(group)}
          </View>
        );
      }).reverse()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
  },
  card: {
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    minHeight: 400,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  plantType: {
    fontSize: 18,
    opacity: 0.8,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  memberCount: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    margin: 4,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  joinButton: {
    marginTop: 10,
  },
  noMoreCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlantGroupSwipePool; 