import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocus } from '../context/FocusContext';
import { clearSessions } from '../utils/storage'; // Artık hata vermez

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme, toggleTheme } = useFocus();

  // Bu state'ler şimdilik UI için
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [haptics, setHaptics] = useState(true);

  // Verileri Temizle Fonksiyonu
  const handleClearData = async () => {
    Alert.alert(
      "Verileri Temizle",
      "Tüm odaklanma geçmişiniz kalıcı olarak silinecek. Emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: async () => {
            await clearSessions(); 
            Alert.alert("Başarılı", "Tüm veriler temizlendi.");
          }
        }
      ]
    );
  };

  const handleSupport = () => {
    // Buraya kendi GitHub veya iletişim linkini koyabilirsin
    Linking.openURL('https://github.com/'); 
  };

  // --- REUSABLE AYAR SATIRI BİLEŞENİ ---
  const SettingItem = ({ icon, color, label, type, value, onToggle, onPress, isDestructive }) => (
    <TouchableOpacity 
      activeOpacity={type === 'switch' ? 1 : 0.7} 
      onPress={type === 'link' || type === 'button' ? onPress : null}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={styles.rowLeft}>
        {/* İkon Kutusu */}
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[
          styles.rowLabel, 
          { color: isDestructive ? '#ef4444' : colors.text }
        ]}>
          {label}
        </Text>
      </View>

      {/* Sağ Taraf: Switch veya Ok */}
      <View style={styles.rowRight}>
        {type === 'switch' && (
          <Switch
            trackColor={{ false: "#767577", true: colors.primary }}
            thumbColor={value ? "#fff" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={onToggle}
            value={value}
          />
        )}
        {type === 'link' && (
          <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.5 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      
      {/* BAŞLIK */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}>
        
        {/* BÖLÜM 1: GÖRÜNÜM */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Görünüm</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <SettingItem 
            icon={theme === 'dark' ? "moon" : "sunny"} 
            color="#a855f7" 
            label="Karanlık Mod" 
            type="switch" 
            value={theme === 'dark'} 
            onToggle={toggleTheme} 
          />
        </View>

        {/* BÖLÜM 2: TERCİHLER */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Tercihler</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <SettingItem 
            icon="notifications" 
            color="#3b82f6" 
            label="Bildirimler" 
            type="switch" 
            value={notifications} 
            onToggle={setNotifications} 
          />
           <SettingItem 
            icon="musical-notes" 
            color="#f59e0b" 
            label="Ses Efektleri" 
            type="switch" 
            value={sounds} 
            onToggle={setSounds} 
          />
           <SettingItem 
            icon="phone-portrait" 
            color="#10b981" 
            label="Titreşim" 
            type="switch" 
            value={haptics} 
            onToggle={setHaptics} 
          />
        </View>

        {/* BÖLÜM 3: VERİ VE GİZLİLİK */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Veri</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <SettingItem 
            icon="trash" 
            color="#ef4444" 
            label="Tüm Verileri Temizle" 
            type="button" 
            onPress={handleClearData}
            isDestructive={true}
          />
        </View>

        {/* BÖLÜM 4: HAKKINDA */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Hakkında</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <SettingItem 
            icon="star" 
            color="#eab308" 
            label="Uygulamayı Değerlendir" 
            type="link" 
            onPress={() => Alert.alert("Teşekkürler", "Bizi desteklediğiniz için teşekkürler!")}
          />
           <SettingItem 
            icon="logo-github" 
            color={colors.text} 
            label="Geliştirici Sayfası" 
            type="link" 
            onPress={handleSupport}
          />
        </View>

        <Text style={[styles.versionText, { color: colors.text }]}>Sürüm 1.0.0</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 34, fontWeight: '800' },
  contentContainer: { padding: 20 },
  
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.6,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 10,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Row Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)', 
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 30,
    opacity: 0.4,
    fontSize: 12,
  },
});