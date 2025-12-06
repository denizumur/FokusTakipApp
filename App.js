import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import FocusScreen from './screens/FocusScreen';
import ReportScreen from './screens/ReportScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={({ route }) => ({
          headerShown: false, // Üstteki default başlığı kaldır
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = route.name === 'Zamanlayıcı' ? 'timer' : 'stats-chart';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2980b9',
          tabBarInactiveTintColor: 'gray',
        })}>
        <Tab.Screen name="Zamanlayıcı" component={FocusScreen} />
        <Tab.Screen name="Raporlar" component={ReportScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}