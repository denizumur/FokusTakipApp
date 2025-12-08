import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocus } from '../context/FocusContext';

export default function SettingsScreen() {
  const { 
    workMinutes, updateWorkTime, 
    breakMinutes, updateBreakTime, 
    theme, toggleTheme, colors 
  } = useFocus();
  
  const insets = useSafeAreaInsets();

  // Basit Sayaç Bileşeni (+ / -)
  const Counter = ({ label, value, onIncrease, onDecrease }) => (
    <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.counterControl}>
        <TouchableOpacity onPress={onDecrease} style={[styles.btn, { borderColor: colors.border }]}>
          <Ionicons name="remove" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.value, { color: colors.primary }]}>{value} dk</Text>
        <TouchableOpacity onPress={onIncrease} style={[styles.btn, { borderColor: colors.border }]}>
          <Ionicons name="add" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <Text style={[styles.header, { color: colors.text }]}>⚙️ Ayarlar</Text>
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* SÜRE AYARLARI */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Zamanlayıcı</Text>
        
        <Counter 
          label="Odaklanma Süresi" 
          value={workMinutes} 
          onIncrease={() => updateWorkTime(workMinutes + 5)}
          onDecrease={() => workMinutes > 5 && updateWorkTime(workMinutes - 5)}
        />
        
        <Counter 
          label="Mola Süresi" 
          value={breakMinutes} 
          onIncrease={() => updateBreakTime(breakMinutes + 1)}
          onDecrease={() => breakMinutes > 1 && updateBreakTime(breakMinutes - 1)}
        />

        {/* GÖRÜNÜM AYARLARI */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>Görünüm</Text>
        
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <Ionicons name={theme === 'dark' ? "moon" : "sunny"} size={22} color={colors.primary} style={{marginRight:10}} />
            <Text style={[styles.label, { color: colors.text }]}>Neon / Dark Mode</Text>
          </View>
          <Switch 
            value={theme === 'dark'} 
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: colors.primary }}
            thumbColor={"#f4f3f4"}
          />
        </View>

        <Text style={{textAlign:'center', marginTop: 50, color: '#666'}}>v1.0.0 - FokusTakipApp</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 28, fontWeight: 'bold', padding: 20 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, opacity: 0.8 },
  settingRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, borderRadius: 12, marginBottom: 15, borderWidth: 1 
  },
  label: { fontSize: 16, fontWeight: '500' },
  counterControl: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  btn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 18, fontWeight: 'bold', minWidth: 50, textAlign: 'center' }
});