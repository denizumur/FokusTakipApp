import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Button, StyleSheet, Text, View } from 'react-native';
import { formatTime } from '../utils/format';
import { saveSession } from '../utils/storage';

const INITIAL_TIME = 25 * 60; // 25 Dakika
const CATEGORIES = ["Ders", "Kodlama", "Okuma", "Proje", "Spor"];

export default function FocusScreen() {
  const [time, setTime] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [distractions, setDistractions] = useState(0); // Dikkat kaçırma sayısı
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isActive, setIsActive] = useState(false); // Seans aktif mi?
  
  const appState = useRef(AppState.currentState);

  // 1. ZAMANLAYICI MANTIĞI
  useEffect(() => {
    let interval = null;
    if (isRunning && time > 0) {
      interval = setInterval(() => setTime(t => t - 1), 1000);
    } else if (time === 0) {
      handleFinish(true); // Süre bitti
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  // 2. DİKKAT DAĞINIKLIĞI TAKİBİ (MVP'nin Kalbi)
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextAppState => {
      if (isActive && isRunning) {
        // Kullanıcı uygulamadan çıktı (Background)
        if (appState.current.match(/active/) && nextAppState === 'background') {
          setDistractions(d => d + 1);
          setIsRunning(false); // Cezalı duraklatma
        } 
        // Kullanıcı geri döndü (Active)
        else if (appState.current.match(/background/) && nextAppState === 'active') {
          Alert.alert("DİKKAT!", "Başka uygulamaya geçtin! Devam edelim mi?", [
            { text: "Bitir", onPress: () => handleFinish(false) },
            { text: "Devam Et", onPress: () => setIsRunning(true) }
          ]);
        }
      }
      appState.current = nextAppState;
    });
    return () => sub.remove();
  }, [isActive, isRunning]);

  // Bitiş ve Kayıt Fonksiyonu
  const handleFinish = async (completed) => {
    setIsRunning(false);
    setIsActive(false);
    
    const elapsed = INITIAL_TIME - time;
    // Sadece 5 saniyeden uzun sürdüyse kaydet (Test için)
    if (elapsed > 5) {
        await saveSession({
            id: Date.now(), 
            duration: elapsed, 
            category, 
            distractions, 
            date: new Date().toISOString()
        });
        if(completed) Alert.alert("Tebrikler!", "Seans tamamlandı.");
    }
    
    setTime(INITIAL_TIME);
    setDistractions(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(time)}</Text>
      
      <Picker 
        selectedValue={category} 
        onValueChange={setCategory} 
        style={{width: '80%', height: 50, marginBottom: 20}} 
        enabled={!isActive}
      >
        {CATEGORIES.map((c, i) => <Picker.Item key={i} label={c} value={c} />)}
      </Picker>

      <Text style={styles.distraction}>Dikkat Dağınıklığı: {distractions}</Text>

      <View style={{gap: 15, width: '60%'}}>
        <Button 
            title={isRunning ? "DURAKLAT" : "BAŞLAT"} 
            onPress={() => { setIsRunning(!isRunning); setIsActive(true); }} 
            color={isRunning ? "#f39c12" : "#27ae60"} 
        />
        <Button 
            title="SIFIRLA / BİTİR" 
            onPress={() => { setIsRunning(false); setIsActive(false); setTime(INITIAL_TIME); setDistractions(0); }} 
            color="#c0392b" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ 
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ecf0f1' },
    timer: { fontSize: 80, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
    distraction: { fontSize: 18, color: '#e74c3c', marginBottom: 30, fontWeight: 'bold' }
});