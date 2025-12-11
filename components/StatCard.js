import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const StatCard = ({ label, value, sub, icon, color, colors }) => {
  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.card, 
        borderColor: colors.border,
        shadowColor: colors.text, // Temaya göre gölge rengi (karanlık modda hafif gri, aydınlıkta siyah)
      }
    ]}>
      {/* İkon Kutusu (Opsiyonel: Hafif bir arka plan eklenebilir) */}
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}> 
        {icon && <Ionicons name={icon} size={28} color={color} />}
      </View>

      <Text style={[styles.cardValue, { color: color }]}>{value}</Text>
      <Text style={[styles.cardLabel, { color: colors.text }]}>{label}</Text>
      
      {sub && (
        <Text style={[styles.subText, { color: colors.text }]}>{sub}</Text>
      )}
    </View>
  );
};

export default StatCard;

const styles = StyleSheet.create({
  card: {
    width: '48%', // Yan yana iki kart için
    paddingVertical: 24, // Dikey boşluk artırıldı
    paddingHorizontal: 16,
    borderRadius: 24, // Daha yumuşak köşeler
    borderWidth: 1, // İnce çerçeve
    alignItems: 'center',
    justifyContent: 'center',
    // --- Modern Gölge Efektleri ---
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, // Çok hafif gölge
    shadowRadius: 16,
    elevation: 4, // Android için
    marginBottom: 10,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 16,
    marginBottom: 12, // İkon ile metin arası boşluk
  },
  cardValue: {
    fontSize: 28, // Rakam biraz büyütüldü
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  subText: {
    opacity: 0.5,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  }
});