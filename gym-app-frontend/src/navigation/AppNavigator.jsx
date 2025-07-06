import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Image } from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import FollowingScreen from '../screens/FollowingScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';

import followingIcon from '../../assets/images/users.png';
import workoutIcon from '../../assets/images/dumbbell.png'
import exploreIcon from '../../assets/images/search.png';
import profileIcon from '../../assets/images/square-user.png';

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Following"
        component={FollowingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={followingIcon}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={workoutIcon}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={exploreIcon}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ username: 'testuser', isOwnProfile: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={profileIcon}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
