import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FeedScreen } from '../screens/FeedScreen';
import { DeckListScreen } from '../screens/DeckListScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

interface AnimatedTabIconProps {
  name: any;
  color: string;
  size: number;
  focused: boolean;
  dotColor: string;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  name,
  color,
  size,
  focused,
  dotColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(focused ? -2 : 0)).current;
  const dotAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.88,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.12,
            friction: 4,
            tension: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(translateYAnim, {
          toValue: -3,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.spring(dotAnim, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, scaleAnim, translateYAnim, dotAnim]);

  return (
    <View style={styles.iconWrap}>
      <Animated.View
        style={{
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        }}
      >
        <Ionicons name={name} size={size || 22} color={color} />
      </Animated.View>
      <Animated.View
        style={[
          styles.activeDot,
          {
            backgroundColor: dotColor,
            opacity: dotAnim,
            transform: [{ scale: dotAnim }],
          },
        ]}
      />
    </View>
  );
};

export const RootNavigator = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const bottomBarPadding = Math.max(insets.bottom, 8);
  const bottomBarHeight = 58 + bottomBarPadding;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: bottomBarHeight,
            paddingBottom: bottomBarPadding,
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Akış') {
              iconName = focused ? 'compass' : 'compass-outline';
            } else if (route.name === 'Desteler') {
              iconName = focused ? 'layers' : 'layers-outline';
            } else if (route.name === 'Mini Quiz') {
              iconName = focused ? 'help-circle' : 'help-circle-outline';
            } else if (route.name === 'Profil') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return (
              <AnimatedTabIcon
                name={iconName}
                size={size || 22}
                color={color}
                focused={focused}
                dotColor={colors.primary}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Akış" component={FeedScreen} />
        <Tab.Screen name="Desteler" component={DeckListScreen} />
        <Tab.Screen name="Mini Quiz" component={QuizScreen} />
        <Tab.Screen name="Profil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
