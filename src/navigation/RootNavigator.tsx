import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FeedScreen } from '../screens/FeedScreen';
import { DeckListScreen } from '../screens/DeckListScreen';
import { CreateCardScreen } from '../screens/CreateCardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { THEME } from '../constants/theme';

const Tab = createBottomTabNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: THEME.colors.background,
            borderTopColor: THEME.colors.cardBorder,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: THEME.colors.primary,
          tabBarInactiveTintColor: THEME.colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Akış') {
              iconName = focused ? 'play-circle' : 'play-circle-outline';
            } else if (route.name === 'Desteler') {
              iconName = focused ? 'layers' : 'layers-outline';
            } else if (route.name === 'Ekle') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Profil') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size || 22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Akış" component={FeedScreen} />
        <Tab.Screen name="Desteler" component={DeckListScreen} />
        <Tab.Screen name="Ekle" component={CreateCardScreen} />
        <Tab.Screen name="Profil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
