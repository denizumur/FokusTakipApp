import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocus } from '../context/FocusContext'; // YENİ
import { saveSession } from '../utils/storage';

const CATEGORIES = ["Ders Çalışma", "Kodlama", "Kitap Okuma", "Proje", "Diğer"];

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (num) => (num < 10 ? '0' + num : num);
  return `${pad(minutes)}:${pad(seconds)}`;
};

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  // CONTEXT'TEN VERİLERİ ÇEKİYORUZ
  const { workMinutes, breakMinutes, colors, theme, lastCategory, updateCategory, loading } = useFocus();

  // State'leri Context gelene kadar bekletmemiz gerekebilir ama basit tutalım
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [distractions, setDistractions] = useState(0); 
  const [pauseCount, setPauseCount] = useState(0);    
  const appState = useRef(AppState.currentState);

  // Context Yüklendiğinde veya Süre Değiştiğinde Sayacı Güncelle
  useEffect(() => {
    if (!isActive) {
      setTime(isWorkMode ? workMinutes * 60 : breakMinutes * 60);
    }
  }, [workMinutes, breakMinutes, isWorkMode, loading]);

  // Sayaç Mantığı (Değişmedi)
  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000);
    } else if (time === 0) {
      handleTimerEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  // Takip Mantığı (Değişmedi)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (isActive && isWorkMode) {
        if (appState.current.match(/active/) && nextAppState === 'background') {
          setDistractions((d) => d + 1);
          setIsActive(false); 
        } else if (appState.current.match(/background/) && nextAppState === 'active') {
          Alert.alert("DİKKAT!", "Odağın bozuldu!", [
            { text: "Bitir", onPress: () => hardReset() },
            { text: "Devam", onPress: () => setIsActive(true) }
          ]);
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isActive, isWorkMode]);

  const handleToggle = () => { if (isActive) setPauseCount(p => p + 1); setIsActive(!isActive); };
  
  const handleTimerEnd = async () => {
    setIsActive(false);
    Vibration.vibrate(); 
    if (isWorkMode) {
      await saveSessionData(workMinutes * 60 - time); // Tam süre kaydet
      Alert.alert("Tebrikler!", "Mola zamanı!", [{ text: "Mola", onPress: () => startBreak() }]);
    } else {
      Alert.alert("Mola Bitti!", "Çalışmaya devam.", [{ text: "Başla", onPress: () => startWork() }]);
    }
  };

  const handleManualStop = () => {
    const totalTime = isWorkMode ? workMinutes * 60 : breakMinutes * 60;
    const elapsed = totalTime - time;
    
    if (isWorkMode && elapsed > 10) {
        Alert.alert("Seansı Bitir", "Kaydedilsin mi?", [
            { text: "İptal", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => hardReset() },
            { text: "Kaydet", onPress: async () => { await saveSessionData(elapsed); hardReset(); } }
        ]);
    } else { hardReset(); }
  };

  const saveSessionData = async (durationSec) => {
    await saveSession({
        id: Date.now(),
        duration: durationSec,
        category: lastCategory, // Context'teki kategori
        distractions,
        pauseCount,
        date: new Date().toISOString(),
    });
  };

  const startBreak = () => { setIsWorkMode(false); setTime(breakMinutes * 60); setIsActive(true); };
  const startWork = () => { setIsWorkMode(true); setTime(workMinutes * 60); setDistractions(0); setPauseCount(0); setIsActive(false); };
  const hardReset = () => { setIsActive(false); setIsWorkMode(true); setTime(workMinutes * 60); setDistractions(0); setPauseCount(0); };

  // DİNAMİK RENKLER (Context'ten geliyor)
  const activeColor = isWorkMode ? colors.primary : colors.secondary;

  if (loading) return <View style={styles.container}><Text>Yükleniyor...</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <Text style={[styles.modeText, { color: activeColor, textShadowColor: theme === 'dark' ? activeColor : 'transparent' }]}>
            {isWorkMode ? (theme === 'dark' ? "SYSTEM: FOCUS" : "ODAKLANMA") : (theme === 'dark' ? "SYSTEM: BREAK" : "MOLA")}
        </Text>
      </View>

      <View style={[styles.timerContainer, { 
          borderColor: activeColor, 
          backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff',
          shadowColor: activeColor 
      }]}>
        <View style={styles.innerCircle}>
            <Text style={[styles.timerText, { color: activeColor, textShadowColor: theme === 'dark' ? activeColor : 'transparent' }]}>
            {formatTime(time)}
            </Text>
            <Text style={[styles.statusLabel, { color: activeColor, opacity: 0.8 }]}>
                {isActive ? "RUNNING..." : "PAUSED"}
            </Text>
        </View>
      </View>

      <View style={[styles.pickerWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Picker
          selectedValue={lastCategory}
          onValueChange={(itemValue) => updateCategory(itemValue)} // Context Güncelle
          enabled={!isActive && isWorkMode}
          dropdownIconColor={colors.text}
          style={{ width: 250, color: colors.text }}
          itemStyle={{ color: colors.text }}
        >
          {CATEGORIES.map((cat, index) => (
            <Picker.Item key={index} label={cat} value={cat} color={colors.text} />
          ))}
        </Picker>
      </View>

      {isWorkMode && (
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
             <Ionicons name="alert-circle" size={20} color="#ff4444" />
             <Text style={[styles.statLabel, {color: colors.text}]}>Dikkat: </Text>
             <Text style={[styles.statValue, {color: colors.text}]}>{distractions}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
             <Ionicons name="pause" size={20} color="#ffbb00" />
             <Text style={[styles.statLabel, {color: colors.text}]}>Duraklatma: </Text>
             <Text style={[styles.statValue, {color: colors.text}]}>{pauseCount}</Text>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.mainButton, { backgroundColor: isActive ? '#ffbb00' : activeColor }]} 
          onPress={handleToggle}
        >
          <Ionicons name={isActive ? "pause" : "play"} size={24} color="black" />
          <Text style={[styles.buttonText, { color: 'black' }]}>{isActive ? "DURAKLAT" : "BAŞLAT"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.card, borderColor: '#ff4444' }]} onPress={handleManualStop}>
          <Ionicons name="stop" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 30 },
  modeText: { fontSize: 20, fontWeight: '900', letterSpacing: 4, textShadowRadius: 10 },
  timerContainer: {
    width: 280, height: 280, borderRadius: 140, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.8, shadowRadius: 20, elevation: 10,
  },
  innerCircle: { alignItems: 'center', justifyContent: 'center' },
  timerText: { 
    fontSize: 75, fontWeight: 'bold', letterSpacing: 2, textShadowRadius: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' 
  },
  statusLabel: { marginTop: 10, fontSize: 14, fontWeight: '600', letterSpacing: 2 },
  pickerWrapper: { marginTop: 30, borderRadius: 8, borderWidth: 1 },
  statsRow: { flexDirection: 'row', marginTop: 25, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  divider: { width: 1, height: 20, backgroundColor: '#444' },
  statLabel: { fontSize: 14, marginLeft: 5 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  buttonContainer: { flexDirection: 'row', marginTop: 40, alignItems: 'center', gap: 20 },
  mainButton: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, alignItems: 'center', gap: 10, elevation: 5 },
  resetButton: { padding: 16, borderRadius: 12, borderWidth: 1, elevation: 2 },
  buttonText: { fontSize: 18, fontWeight: 'bold' },
});