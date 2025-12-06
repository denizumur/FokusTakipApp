import { Ionicons } from '@expo/vector-icons'; // İkonlar için
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { formatTime } from '../utils/format';
import { saveSession } from '../utils/storage';

// SÜRELER (Saniye Cinsinden)
const WORK_TIME = 25 * 60; // 25 Dakika
const BREAK_TIME = 5 * 60; // 5 Dakika
const CATEGORIES = ["Ders Çalışma", "Kodlama", "Kitap Okuma", "Proje", "Diğer"];

export default function FocusScreen() {
  const [time, setTime] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false); // Sayaç çalışıyor mu?
  const [isWorkMode, setIsWorkMode] = useState(true); // Çalışma modu mu, Mola mı?
  const [distractions, setDistractions] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  
  const appState = useRef(AppState.currentState);

  // --- SAYAÇ MANTIĞI ---
  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000);
    } else if (time === 0) {
      handleTimerEnd(); // Süre Bitti
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  // --- DİKKAT DAĞINIKLIĞI TAKİBİ (Sadece Çalışma Modunda) ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Sadece "Çalışma Modu"ndaysak ve sayaç aktifse takip et
      if (isActive && isWorkMode) {
        if (appState.current.match(/active/) && nextAppState === 'background') {
          // Uygulamadan çıkıldı
          setDistractions((d) => d + 1);
          setIsActive(false); // Cezalı duraklatma
        } else if (appState.current.match(/background/) && nextAppState === 'active') {
          // Geri dönüldü
          Alert.alert("DİKKAT!", "Odağın bozuldu! Devam etmek istiyor musun?", [
            { text: "Seansı Yak (Bitir)", onPress: () => resetSession() },
            { text: "Devam Et", onPress: () => setIsActive(true) }
          ]);
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isActive, isWorkMode]);

  // --- FONKSİYONLAR ---

  const handleTimerEnd = async () => {
    setIsActive(false);
    Vibration.vibrate(); // Telefon titresin

    if (isWorkMode) {
      // Çalışma bitti, veriyi kaydet
      const elapsed = WORK_TIME - time; // Tam süre
      await saveSession({
        id: Date.now(),
        duration: elapsed,
        category,
        distractions,
        date: new Date().toISOString(),
      });
      
      Alert.alert("Tebrikler! 🎉", "Odaklanma süresi bitti. Mola zamanı!", [
        { text: "Molaya Başla", onPress: () => startBreak() }
      ]);
    } else {
      // Mola bitti
      Alert.alert("Mola Bitti! ☕", "Hadi tekrar çalışmaya başlayalım.", [
        { text: "Çalışmaya Başla", onPress: () => startWork() }
      ]);
    }
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
    setIsActive(false); // Kullanıcı başlatana kadar bekle
  };

  const resetSession = () => {
    setIsActive(false);
    setIsWorkMode(true);
    setTime(WORK_TIME);
    setDistractions(0);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // Dinamik Tasarım Ayarları
  const containerBg = isWorkMode ? '#f0f9ff' : '#fff7ed'; // Mavi vs Turuncu arka plan
  const timerColor = isWorkMode ? '#0284c7' : '#ea580c'; 

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      
      {/* BAŞLIK */}
      <Text style={[styles.modeText, { color: timerColor }]}>
        {isWorkMode ? "🎯 ODAKLANMA ZAMANI" : "☕ MOLA ZAMANI"}
      </Text>

      {/* SAYAÇ */}
      <View style={[styles.timerCircle, { borderColor: timerColor }]}>
        <Text style={[styles.timerText, { color: timerColor }]}>
          {formatTime(time)}
        </Text>
      </View>

      {/* KATEGORİ (Sadece Çalışırken Değişir) */}
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

      {/* İSTATİSTİK (Sadece Çalışma Modunda Görünür) */}
      {isWorkMode && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Dikkat Dağınıklığı: </Text>
          <Text style={[styles.statsCount, { color: distractions > 0 ? 'red' : 'green' }]}>
            {distractions}
          </Text>
        </View>
      )}

      {/* BUTONLAR */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.mainButton, { backgroundColor: isActive ? '#fbbf24' : '#22c55e' }]} 
          onPress={toggleTimer}
        >
          <Ionicons name={isActive ? "pause" : "play"} size={24} color="white" />
          <Text style={styles.buttonText}>{isActive ? "DURAKLAT" : "BAŞLAT"}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.resetButton]} 
          onPress={resetSession}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    letterSpacing: 2,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    elevation: 5, // Android gölge
    shadowColor: '#000', // iOS gölge
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  timerText: {
    fontSize: 70,
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginTop: 30,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#666',
  },
  statsCount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 40,
    alignItems: 'center',
    gap: 15,
  },
  mainButton: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    gap: 10,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 50,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});