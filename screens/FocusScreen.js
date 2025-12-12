import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg'; // SVG Eklendi
import { useFocus } from '../context/FocusContext';
import { saveSession } from '../utils/storage';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.70; // Daire boyutu
const STROKE_WIDTH = 15;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CATEGORIES = ["Ders Çalışma", "Kodlama", "Kitap Okuma", "Proje", "Diğer"];

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (num) => (num < 10 ? '0' + num : num);
  return `${pad(minutes)}:${pad(seconds)}`;
};

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme, lastCategory, updateCategory, loading } = useFocus(); // Context verileri

  // Varsayılan süreler (Dk)
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [distractions, setDistractions] = useState(0); 
  const [pauseCount, setPauseCount] = useState(0);     
  const appState = useRef(AppState.currentState);

  // Daire İlerlemesi Hesabı
  const totalDuration = isWorkMode ? workMinutes * 60 : breakMinutes * 60;
  const progress = time / totalDuration;
  const strokeDashoffset = CIRCUMFERENCE - (progress * CIRCUMFERENCE);

  // Sayaç Mantığı
  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000);
    } else if (time === 0 && isActive) {
      handleTimerEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  // Arka Plan Takibi
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (isActive && isWorkMode) {
        if (appState.current.match(/active/) && nextAppState === 'background') {
          // Arka plana atıldı -> Dikkat dağınıklığı say
          setDistractions((d) => d + 1);
          setIsActive(false); 
          Vibration.vibrate(50);
        } else if (appState.current.match(/background/) && nextAppState === 'active') {
          // Geri geldi -> Uyar
          Alert.alert("DİKKAT!", "Odağın bozuldu! Devam etmek istiyor musun?", [
            { text: "Bitir", style: "destructive", onPress: () => hardReset() },
            { text: "Devam Et", onPress: () => setIsActive(true) }
          ]);
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isActive, isWorkMode]);

  // Hızlı Süre Seçimi (Work Mode için)
  const handleDurationSelect = (mins) => {
    if (isActive) {
      Alert.alert("Sayaç Çalışıyor", "Süreyi değiştirmek için önce durdurmalısın.");
      return;
    }
    setIsWorkMode(true);
    setWorkMinutes(mins);
    setTime(mins * 60);
    setDistractions(0);
    setPauseCount(0);
  };

  const handleToggle = () => { 
      if (isActive) {
          setPauseCount(p => p + 1); // Duraklatma sayısını artır
      }
      setIsActive(!isActive); 
      Vibration.vibrate(50);
  };
  
  const handleTimerEnd = async () => {
    setIsActive(false);
    Vibration.vibrate([0, 500, 200, 500]); 
    if (isWorkMode) {
      await saveSessionData(workMinutes * 60); // Tam süre kaydet
      Alert.alert("Tebrikler!", "Çalışma bitti. Mola zamanı!", [{ text: "Mola Başlat", onPress: () => startBreak() }]);
    } else {
      Alert.alert("Mola Bitti!", "Hadi tekrar çalışalım.", [{ text: "Çalışmaya Dön", onPress: () => startWork() }]);
    }
  };

  const handleManualStop = () => {
    const totalTime = isWorkMode ? workMinutes * 60 : breakMinutes * 60;
    const elapsed = totalTime - time;
    
    if (isWorkMode && elapsed > 60) { // En az 1 dk çalıştıysa sor
        Alert.alert("Seansı Bitir", "Mevcut ilerlemen kaydedilsin mi?", [
            { text: "İptal", style: "cancel" },
            { text: "Sil ve Çık", style: "destructive", onPress: () => hardReset() },
            { text: "Kaydet ve Bitir", onPress: async () => { await saveSessionData(elapsed); hardReset(); } }
        ]);
    } else { 
        hardReset(); 
    }
  };

  const saveSessionData = async (durationSec) => {
    await saveSession({
        id: Date.now(),
        duration: durationSec,
        category: lastCategory, 
        distractions,
        pauseCount,
        date: new Date().toISOString(),
    });
  };

  const startBreak = () => { setIsWorkMode(false); setTime(breakMinutes * 60); setIsActive(true); };
  const startWork = () => { setIsWorkMode(true); setTime(workMinutes * 60); setDistractions(0); setPauseCount(0); setIsActive(false); };
  const hardReset = () => { setIsActive(false); setIsWorkMode(true); setTime(workMinutes * 60); setDistractions(0); setPauseCount(0); };

  // DİNAMİK RENKLER
  const activeColor = isWorkMode ? colors.primary : '#34D399'; // Mola rengi yeşil olsun

  // Ufak Bileşen: Süre Seçici Buton
  const DurationChip = ({ mins }) => (
    <TouchableOpacity 
      onPress={() => handleDurationSelect(mins)}
      style={[styles.chip, { 
          backgroundColor: (workMinutes === mins && isWorkMode) ? activeColor : colors.card,
          borderColor: colors.border
      }]}
    >
      <Text style={{ 
          color: (workMinutes === mins && isWorkMode) ? (theme === 'dark' ? '#000' : '#fff') : colors.text, 
          fontWeight: '600' 
      }}>{mins}</Text>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.container}><Text>Yükleniyor...</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      
      {/* BAŞLIK */}
      <View style={styles.header}>
        <Text style={[styles.modeText, { color: activeColor }]}>
            {isWorkMode ? (isActive ? "ODAKLANILIYOR" : "HAZIR MISIN?") : "MOLA ZAMANI"}
        </Text>
      </View>

      {/* SAYAÇ DAİRESİ */}
      <View style={styles.timerContainer}>
         <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Arka Plan Halka */}
            <Circle
                cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS}
                stroke={colors.border} strokeWidth={STROKE_WIDTH} fill="transparent"
            />
            {/* İlerleme Halkası */}
            <Circle
                cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS}
                stroke={activeColor} strokeWidth={STROKE_WIDTH} fill="transparent"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" rotation="-90" origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
         </Svg>
         
         <View style={styles.innerCircle}>
            <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(time)}</Text>
            {/* Kategori Seçici (Sadece dururken değiştirilebilir) */}
            <View style={styles.pickerContainer}>
                 <Picker
                    selectedValue={lastCategory}
                    onValueChange={(itemValue) => updateCategory(itemValue)}
                    enabled={!isActive && isWorkMode}
                    dropdownIconColor={colors.text}
                    style={{ width: 160, color: colors.text, transform: [{ scale: 0.9 }] }}
                    itemStyle={{ color: colors.text, fontSize: 14 }}
                 >
                    {CATEGORIES.map((cat, index) => (
                        <Picker.Item key={index} label={cat} value={cat} />
                    ))}
                 </Picker>
            </View>
         </View>
      </View>

      {/* İSTATİSTİK & HIZLI SEÇİM */}
      <View style={styles.middleSection}>
          {isWorkMode ? (
             <View style={{ width: '100%', alignItems: 'center' }}>
                 {/* İstatistikler */}
                 <View style={[styles.statsRow, { borderColor: colors.border }]}>
                    <View style={styles.statItem}>
                        <Ionicons name="eye-off" size={18} color="#ef4444" />
                        <Text style={[styles.statValue, { color: colors.text }]}>{distractions}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="pause" size={18} color="#f59e0b" />
                        <Text style={[styles.statValue, { color: colors.text }]}>{pauseCount}</Text>
                    </View>
                 </View>

                 {/* Hızlı Süre Seçimi */}
                 <View style={styles.chipsRow}>
                    <DurationChip mins={15} />
                    <DurationChip mins={25} />
                    <DurationChip mins={45} />
                    <DurationChip mins={60} />
                 </View>
             </View>
          ) : (
             <Text style={{ color: colors.text, opacity: 0.6 }}>İyi dinlenmeler!</Text>
          )}
      </View>

      {/* BUTONLAR */}
      <View style={styles.buttonContainer}>
        {/* Reset Butonu */}
        <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={handleManualStop}
        >
          <Ionicons name={isActive ? "stop" : "refresh"} size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Ana Başlat/Durdur Butonu */}
        <TouchableOpacity 
          style={[styles.mainButton, { backgroundColor: isActive ? '#ef4444' : activeColor }]} 
          onPress={handleToggle}
        >
          <Ionicons name={isActive ? "pause" : "play"} size={32} color={theme === 'dark' ? '#000' : '#fff'} />
          <Text style={[styles.buttonText, { color: theme === 'dark' ? '#000' : '#fff' }]}>
              {isActive ? "DURAKLAT" : "BAŞLAT"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between' }, // Space-between ile yaydık
  header: { marginTop: 20 },
  modeText: { fontSize: 18, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  
  // Sayaç Stilleri
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  innerCircle: { 
      position: 'absolute', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100%',
      height: '100%'
  },
  timerText: { 
    fontSize: 64, 
    fontWeight: '800', 
    fontVariant: ['tabular-nums'],
    letterSpacing: -2
  },
  pickerContainer: {
      marginTop: -10, // Sayının hemen altına
      height: 50,
      justifyContent: 'center',
      overflow: 'hidden',
  },

  // Orta Bölüm (İstatistik + Çipler)
  middleSection: {
      width: '100%',
      paddingHorizontal: 30,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
  },
  statsRow: { 
      flexDirection: 'row', 
      paddingVertical: 8, 
      paddingHorizontal: 20, 
      borderRadius: 20, 
      borderWidth: 1, 
      alignItems: 'center',
      marginBottom: 15,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { width: 1, height: 16, marginHorizontal: 15 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  
  chipsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: 10,
  },
  chip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
  },

  // Butonlar
  buttonContainer: { 
      flexDirection: 'row', 
      marginBottom: 30, 
      alignItems: 'center', 
      paddingHorizontal: 30,
      gap: 15 
  },
  mainButton: { 
      flex: 1, 
      height: 70,
      borderRadius: 35,
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 10, 
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 5,
  },
  resetButton: { 
      width: 60, 
      height: 60, 
      borderRadius: 30, 
      borderWidth: 1, 
      alignItems: 'center', 
      justifyContent: 'center',
  },
  buttonText: { fontSize: 18, fontWeight: 'bold' },
});