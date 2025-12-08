//ayarları telefona kaydeder ve geri yükler.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const FocusContext = createContext();

export const FocusProvider = ({ children }) => {
  // Varsayılan Ayarlar
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [theme, setTheme] = useState('dark'); // 'dark' (Neon) veya 'light'
  const [lastCategory, setLastCategory] = useState('Ders Çalışma');

  // Yükleme Durumu
  const [loading, setLoading] = useState(true);

  // 1. Uygulama açılınca verileri hafızadan oku
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedWork = await AsyncStorage.getItem('@work_min');
        const storedBreak = await AsyncStorage.getItem('@break_min');
        const storedTheme = await AsyncStorage.getItem('@app_theme');
        const storedCat = await AsyncStorage.getItem('@last_cat');

        if (storedWork) setWorkMinutes(parseInt(storedWork));
        if (storedBreak) setBreakMinutes(parseInt(storedBreak));
        if (storedTheme) setTheme(storedTheme);
        if (storedCat) setLastCategory(storedCat);
      } catch (e) {
        console.error("Ayarlar yüklenemedi", e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 2. Ayarlar değişince hafızaya kaydet
  const updateWorkTime = async (min) => {
    setWorkMinutes(min);
    await AsyncStorage.setItem('@work_min', min.toString());
  };

  const updateBreakTime = async (min) => {
    setBreakMinutes(min);
    await AsyncStorage.setItem('@break_min', min.toString());
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await AsyncStorage.setItem('@app_theme', newTheme);
  };

  const updateCategory = async (cat) => {
    setLastCategory(cat);
    await AsyncStorage.setItem('@last_cat', cat);
  };

  // Renk Paletleri (Neon Dark vs Clean Light)
  const colors = theme === 'dark' ? {
    bg: '#121212',
    text: '#ffffff',
    primary: '#00f3ff', // Neon Cyan
    secondary: '#ff0055', // Neon Pink
    card: '#1e1e1e',
    border: '#333'
  } : {
    bg: '#f8fafc',
    text: '#1e293b',
    primary: '#2563eb', // Blue
    secondary: '#ea580c', // Orange
    card: '#ffffff',
    border: '#e2e8f0'
  };

  return (
    <FocusContext.Provider value={{
      workMinutes, updateWorkTime,
      breakMinutes, updateBreakTime,
      theme, toggleTheme, colors,
      lastCategory, updateCategory,
      loading
    }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => useContext(FocusContext);