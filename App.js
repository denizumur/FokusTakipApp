import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { FocusProvider, useFocus } from './context/FocusContext'; // YENİ

import FocusScreen from './screens/FocusScreen';
import ReportScreen from './screens/ReportScreen';
import SettingsScreen from './screens/SettingsScreen'; // YENİ

const Tab = createBottomTabNavigator();

// Tema renklerine erişebilmek için Navigasyonu ayrı bir bileşen yaptık
const AppNavigator = () => {
  const { colors, theme } = useFocus(); // Context'ten renkleri çek

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { 
            backgroundColor: colors.card, 
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 5
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Zamanlayıcı') iconName = focused ? 'timer' : 'timer-outline';
            else if (route.name === 'Raporlar') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            else if (route.name === 'Ayarlar') iconName = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Zamanlayıcı" component={FocusScreen} />
        <Tab.Screen name="Raporlar" component={ReportScreen} />
        <Tab.Screen name="Ayarlar" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <FocusProvider>
      <AppNavigator />
    </FocusProvider>
  );
}