//Verileri telefona kalıcı olarak kaydeden yapı

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@focus_sessions';

// Yeni seans ekle
export const saveSession = async (session) => {
  try {
    const existing = await getSessions();
    const newSessions = [...existing, session];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  } catch (e) { console.error("Kaydetme hatası:", e); }
};

// Tüm seansları getir
export const getSessions = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) { return []; }
};