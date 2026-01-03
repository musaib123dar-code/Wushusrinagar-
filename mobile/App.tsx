import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MeetingRoomScreen from './src/screens/MeetingRoomScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ title: 'Dashboard' }}
        />
        <Stack.Screen 
          name="MeetingRoom" 
          component={MeetingRoomScreen}
          options={{ title: 'Meeting Room', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
