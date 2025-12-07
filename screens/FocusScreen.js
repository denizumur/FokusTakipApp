import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { formatTime } from '../utils/format';
import { saveSession } from '../utils/storage';

// SÜRELER
const WORK_TIME = 25 * 60; 
const BREAK_TIME = 5 * 60; 
const CATEGORIES = ["Ders Çalışma", "Kodlama", "Kitap Okuma", "Proje", "Diğer"];

export default function FocusScreen() {
  const [time, setTime] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isWorkMode, setIsWorkMode] = useState(true);
  
  // SAYAÇLAR
  const [distractions, setDistractions] = useState(0); // Arka plana atma
  const [pauseCount, setPauseCount] = useState(0);     // Manuel durdurma
  
  const [category, setCategory] = useState(CATEGORIES[0]);
  const appState = useRef(AppState.currentState);

  // --- SAYAÇ ---
  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000);
    } else if (time === 0) {
      handleTimerEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  // --- TAKİP (APP STATE) ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (isActive && isWorkMode) {
        if (appState.current.match(/active/) && nextAppState === 'background') {
          setDistractions((d) => d + 1);
          setIsActive(false); // Otomatik duraklat
        } else if (appState.current.match(/background/) && nextAppState === 'active') {
          Alert.alert("DİKKAT!", "Odağın bozuldu! Devam etmek istiyor musun?", [
            { text: "Bitir (Sil)", onPress: () => hardReset() },
            { text: "Devam Et", onPress: () => setIsActive(true) }
          ]);
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isActive, isWorkMode]);

  // --- FONKSİYONLAR ---

  const handleToggle = () => {
    if (isActive) {
      // Eğer çalışıyorsa ve durduruyorsak, duraklatma sayısını artır
      setPauseCount(p => p + 1);
    }
    setIsActive(!isActive);
  };

  const handleTimerEnd = async () => {
    setIsActive(false);
    Vibration.vibrate(); 

    if (isWorkMode) {
      const elapsed = WORK_TIME - time;
      await saveSessionData(elapsed);
      
      Alert.alert("Tebrikler! 🎉", "Odaklanma bitti. Mola zamanı!", [
        { text: "Molaya Başla", onPress: () => startBreak() }
      ]);
    } else {
      Alert.alert("Mola Bitti! ☕", "Hadi tekrar çalışmaya başlayalım.", [
        { text: "Çalışmaya Başla", onPress: () => startWork() }
      ]);
    }
  };

  const handleManualStop = () => {
    const elapsed = isWorkMode ? (WORK_TIME - time) : (BREAK_TIME - time);

    if (isWorkMode && elapsed > 10) {
        Alert.alert("Seansı Bitir", "Bu seansı kaydetmek ister misin?", [
            { text: "İptal", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => hardReset() },
            { 
                text: "Kaydet ve Bitir", 
                onPress: async () => {
                    await saveSessionData(elapsed);
                    hardReset();
                    Alert.alert("Kaydedildi", "Raporlar ekranına bakabilirsin.");
                } 
            }
        ]);
    } else {
        hardReset();
    }
  };

  const saveSessionData = async (durationSec) => {
    await saveSession({
        id: Date.now(),
        duration: durationSec,
        category,
        distractions,
        pauseCount, // YENİ: Duraklatma sayısını da kaydediyoruz
        date: new Date().toISOString(),
    });
  };

  const startBreak = () => {
    setIsWorkMode(false);
    setTime(BREAK_TIME);
    setIsActive(true);
  };

  const startWork = () => {
    setIsWorkMode(true);
    setTime(WORK_TIME);
    setDistractions(0);
    setPauseCount(0); // Sıfırla
    setIsActive(false);
  };

  const hardReset = () => {
    setIsActive(false);
    setIsWorkMode(true);
    setTime(WORK_TIME);
    setDistractions(0);
    setPauseCount(0); // Sıfırla
  };

  // Renkler
  const containerBg = isWorkMode ? '#f0f9ff' : '#fff7ed';
  const timerColor = isWorkMode ? '#0284c7' : '#ea580c'; 

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <Text style={[styles.modeText, { color: timerColor }]}>
        {isWorkMode ? "🎯 ODAKLANMA" : "☕ MOLA"}
      </Text>

      <View style={[styles.timerCircle, { borderColor: timerColor }]}>
        <Text style={[styles.timerText, { color: timerColor }]}>
          {formatTime(time)}
        </Text>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          enabled={!isActive && isWorkMode}
          style={{ width: 250 }}
        >
          {CATEGORIES.map((cat, index) => (
            <Picker.Item key={index} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      {/* İSTATİSTİKLER (YAN YANA) */}
      {isWorkMode && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
             <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
             <Text style={styles.statLabel}>Dikkat: </Text>
             <Text style={styles.statValue}>{distractions}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
             <Ionicons name="pause-circle-outline" size={20} color="#f59e0b" />
             <Text style={styles.statLabel}>Duraklatma: </Text>
             <Text style={styles.statValue}>{pauseCount}</Text>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.mainButton, { backgroundColor: isActive ? '#fbbf24' : '#22c55e' }]} 
          onPress={handleToggle} // Artık handleToggle kullanıyoruz
        >
          <Ionicons name={isActive ? "pause" : "play"} size={24} color="white" />
          <Text style={styles.buttonText}>{isActive ? "DURAKLAT" : "BAŞLAT"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.resetButton]} onPress={handleManualStop}>
          <Ionicons name="stop" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontSize: 24, fontWeight: '900', marginBottom: 30, letterSpacing: 1 },
  timerCircle: { width: 280, height: 280, borderRadius: 140, borderWidth: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', elevation: 8, shadowColor: '#000', shadowOffset:{width:0, height:4}, shadowOpacity:0.3, shadowRadius:5 },
  timerText: { fontSize: 70, fontWeight: 'bold', fontFamily: 'monospace' }, // Monospace sayıların titremesini engeller
  pickerContainer: { marginTop: 30, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, elevation: 2 },
  
  statsRow: { flexDirection: 'row', marginTop: 25, backgroundColor: 'white', padding: 10, borderRadius: 15, elevation: 2, alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  divider: { width: 1, height: 20, backgroundColor: '#ddd' },
  statLabel: { fontSize: 14, color: '#666', marginLeft: 5 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  buttonContainer: { flexDirection: 'row', marginTop: 40, alignItems: 'center', gap: 15 },
  mainButton: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 30, alignItems: 'center', gap: 10, elevation: 4, shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.25, shadowRadius:3.84 },
  resetButton: { backgroundColor: '#ef4444', padding: 16, borderRadius: 50, elevation: 4 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});