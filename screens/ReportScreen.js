import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { getSessions } from '../utils/storage';

export default function ReportScreen() {
  const [totalSeconds, setTotalSeconds] = useState(0);

  // Bu ekran her açıldığında veriyi yeniden çek
  useFocusEffect(useCallback(() => {
    getSessions().then(data => {
        const total = data.reduce((acc, curr) => acc + curr.duration, 0);
        setTotalSeconds(total);
    });
  }, []));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Toplam Odaklanma</Text>
      <Text style={styles.bigText}>{(totalSeconds / 60).toFixed(1)} dk</Text>
      
      <Text style={styles.chartTitle}>Haftalık Aktivite (Demo)</Text>
      <BarChart
        data={{ 
            labels: ["Pzt", "Sal", "Çar", "Per", "Cum"], 
            datasets: [{ data: [20, 45, 28, 80, 50] }] // Burası şimdilik statik
        }}
        width={Dimensions.get("window").width - 40} 
        height={220}
        yAxisLabel=""
        chartConfig={{ 
            backgroundGradientFrom: "#fff", 
            backgroundGradientTo: "#fff", 
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, 
            labelColor:()=>'#333' 
        }}
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60, alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 20, color: '#7f8c8d' },
    bigText: { fontSize: 40, fontWeight: 'bold', color: '#2980b9', marginBottom: 40 },
    chartTitle: { fontSize: 18, marginBottom: 10, alignSelf: 'flex-start', fontWeight: '600' }
});