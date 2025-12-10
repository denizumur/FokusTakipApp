import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Bu bileşen artık her yerden çağrılabilir (Reusability)
export default function StatCard({ label, value, subLabel, icon, color, theme, colors }) {
  return (
    <View style={[
        styles.card, 
        { 
            backgroundColor: colors.card, 
            borderColor: colors.border, 
            borderWidth: 1,
            shadowColor: color 
        }
    ]}>
      {icon && (
          <Ionicons 
            name={icon} 
            size={24} 
            color={color} 
            style={{ marginBottom: 5 }} 
          />
      )}
      <Text style={[styles.cardValue, { color: color }]}>{value}</Text>
      <Text style={[styles.cardLabel, { color: colors.text }]}>{label}</Text>
      
      {subLabel && (
          <Text style={{ color: colors.text, opacity: 0.6, fontSize: 12, marginTop: 2 }}>
            {subLabel}
          </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%', // Grid yapısına uygun
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardLabel: {
    fontSize: 13,
    marginTop: 5,
    fontWeight: '600',
    textAlign: 'center'
  },
});