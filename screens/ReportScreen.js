import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, ContributionGraph, PieChart } from 'react-native-chart-kit';
import { getSessions } from '../utils/storage';

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLORS = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6'];

export default function ReportScreen() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Summary'); 
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  // Veriler
  const [allSessions, setAllSessions] = useState([]);
  const [uniqueCategories, setUniqueCategories] = useState(['Tümü']);

  // İşlenmiş Veriler
  const [stats, setStats] = useState({ today: 0, total: 0, totalDistractions: 0, totalPauses: 0 });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [0] }] });
  const [pieData, setPieData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [categoryList, setCategoryList] = useState([]);

  // 1. Veriyi Çek
  const fetchSessions = async () => {
    setLoading(true);
    const sessions = await getSessions();
    setAllSessions(sessions);

    const cats = new Set(sessions.map(s => s.category));
    setUniqueCategories(['Tümü', ...Array.from(cats)]);

    processData(sessions, selectedCategory);
    setLoading(false);
  };

  // 2. Veriyi İşle
  const processData = (sessions, categoryFilter) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // A. FİLTRELENMİŞ VERİLER (Heatmap, Bar Chart, İstatistikler için)
    const filteredSessions = categoryFilter === 'Tümü' 
        ? sessions 
        : sessions.filter(s => s.category === categoryFilter);

    let totalSec = 0, todaySec = 0, totalDis = 0, totalPau = 0;
    const dailyMap = {};
    const heatmapMap = {};

    filteredSessions.forEach(s => {
      totalSec += s.duration;
      totalDis += (s.distractions || 0);
      totalPau += (s.pauseCount || 0);
      
      const dateStr = s.date.split('T')[0];
      if (dateStr === todayStr) todaySec += s.duration;
      
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + s.duration;
      heatmapMap[dateStr] = (heatmapMap[dateStr] || 0) + 1;
    });

    setStats({ today: todaySec, total: totalSec, totalDistractions: totalDis, totalPauses: totalPau });

    // Bar Chart (Filtreli)
    const labels = [];
    const dataPoints = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      labels.push(dayLabel);
      dataPoints.push(parseFloat(((dailyMap[dayStr] || 0) / 60).toFixed(1)));
    }
    setChartData({ labels, datasets: [{ data: dataPoints }] });

    // Heatmap (Filtreli)
    const hData = Object.keys(heatmapMap).map(date => ({ date, count: heatmapMap[date] }));
    setHeatmapData(hData);
    
    // B. TÜM VERİLER (Pasta Grafik ve Kategori Listesi için - FİLTREDEN BAĞIMSIZ)
    // Kullanıcı haklı: Pasta grafikte filtre olursa hep %100 tek renk çıkar. Anlamsız.
    // O yüzden burayı her zaman "sessions" (ham veri) üzerinden hesaplıyoruz.
    const categoryMap = {};
    sessions.forEach(s => {
        const cat = s.category || "Diğer";
        categoryMap[cat] = (categoryMap[cat] || 0) + s.duration;
    });

    const pData = Object.keys(categoryMap).map((cat, index) => ({
      name: cat,
      population: parseFloat((categoryMap[cat] / 60).toFixed(1)),
      color: COLORS[index % COLORS.length],
      legendFontColor: "#555",
      legendFontSize: 12
    }));
    setPieData(pData);
    
    const totalCatDuration = Object.values(categoryMap).reduce((a, b) => a + b, 0);
    const catList = Object.keys(categoryMap).map((cat, index) => ({
        name: cat,
        duration: categoryMap[cat],
        percentage: totalCatDuration > 0 ? ((categoryMap[cat] / totalCatDuration) * 100).toFixed(1) : 0,
        color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.duration - a.duration);
    setCategoryList(catList);

    // Heatmap seçili tarih güncelleme
    if (selectedDateInfo) {
        const updatedEntry = hData.find(h => h.date === selectedDateInfo.date);
        setSelectedDateInfo(updatedEntry ? { date: selectedDateInfo.date, count: updatedEntry.count } : { date: selectedDateInfo.date, count: 0 });
    }
  };

  const handleCategoryChange = (cat) => {
      setSelectedCategory(cat);
      processData(allSessions, cat);
  };

  useFocusEffect(useCallback(() => { fetchSessions(); }, []));
  const formatMinutes = (seconds) => `${Math.floor(seconds / 60)} dk`;

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  // Bileşenler
  const TabButton = ({ title, activeId, icon }) => (
    <TouchableOpacity 
        style={[styles.tabButton, activeTab === activeId && styles.activeTabButton]}
        onPress={() => setActiveTab(activeId)}
    >
        <Ionicons name={icon} size={18} color={activeTab === activeId ? "#fff" : "#64748b"} />
        <Text style={[styles.tabText, activeTab === activeId && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  const FilterChip = ({ title }) => (
      <TouchableOpacity 
        style={[styles.filterChip, selectedCategory === title && styles.activeFilterChip]}
        onPress={() => handleCategoryChange(title)}
      >
          <Text style={[styles.filterText, selectedCategory === title && styles.activeFilterText]}>
            {title}
          </Text>
      </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>📊 Analizler</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15}}>
            <TabButton title="Özet" activeId="Summary" icon="grid-outline" />
            <TabButton title="Alışkanlık" activeId="Heatmap" icon="calendar-outline" />
            <TabButton title="Kategoriler" activeId="Categories" icon="pie-chart-outline" />
            <TabButton title="Tarihçe" activeId="History" icon="bar-chart-outline" />
        </ScrollView>
      </View>

      {/* FİLTRE ÇUBUĞU - Kategoriler sekmesinde GİZLENİR */}
      {activeTab !== 'Categories' && (
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15}}>
                {uniqueCategories.map((cat, index) => (
                    <FilterChip key={index} title={cat} />
                ))}
            </ScrollView>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSessions} />}
      >
        
        {/* ÖZET */}
        {activeTab === 'Summary' && (
            <View style={styles.gridContainer}>
                <View style={[styles.card, { backgroundColor: '#eff6ff', width: '100%' }]}>
                    <Text style={styles.cardLabel}>{selectedCategory === 'Tümü' ? 'Toplam Odaklanma' : `${selectedCategory} Süresi`}</Text>
                    <Text style={[styles.cardValue, { fontSize: 36, color: '#2563eb' }]}>{formatMinutes(stats.total)}</Text>
                    <Text style={{color:'#666', marginTop:5}}>Bugün: {formatMinutes(stats.today)}</Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#fef2f2' }]}>
                    <Ionicons name="alert-circle" size={24} color="#dc2626" />
                    <Text style={[styles.cardValue, { color: '#dc2626' }]}>{stats.totalDistractions}</Text>
                    <Text style={styles.cardLabel}>Dağınıklık</Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#fff7ed' }]}>
                    <Ionicons name="pause-circle" size={24} color="#ea580c" />
                    <Text style={[styles.cardValue, { color: '#ea580c' }]}>{stats.totalPauses}</Text>
                    <Text style={styles.cardLabel}>Duraklatma</Text>
                </View>
            </View>
        )}

        {/* HEATMAP */}
        {activeTab === 'Heatmap' && (
            <View>
                <Text style={styles.sectionTitle}>
                    {selectedCategory === 'Tümü' ? 'Genel Alışkanlık Haritası' : `${selectedCategory} Alışkanlığı`}
                </Text>
                <View style={styles.selectedDateCard}>
                    <Text style={styles.selectedDateTitle}>
                        {selectedDateInfo ? new Date(selectedDateInfo.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tarih Seçin'}
                    </Text>
                    <Text style={styles.selectedDateValue}>
                        {selectedDateInfo ? `${selectedDateInfo.count} Seans` : '-'}
                    </Text>
                </View>
                <View style={{alignItems: 'center', marginTop: 10}}>
                    <ContributionGraph
                        values={heatmapData}
                        endDate={new Date()}
                        numDays={95}
                        width={SCREEN_WIDTH - 30}
                        height={220}
                        chartConfig={{
                            ...chartConfig,
                            backgroundGradientFrom: "#fff",
                            backgroundGradientTo: "#fff",
                            color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
                        }}
                        onDayPress={(day) => setSelectedDateInfo(day)}
                        gutterSize={2}
                    />
                </View>
                <Text style={styles.hintText}>* {selectedCategory} kategorisi için sıklık verileri.</Text>
            </View>
        )}

        {/* KATEGORİLER (FİLTRESİZ - TÜM DAĞILIM) */}
        {activeTab === 'Categories' && (
            <View>
                 <Text style={styles.sectionTitle}>Tüm Zamanların Dağılımı</Text>
                 {pieData.length > 0 ? (
                    <>
                        <PieChart
                            data={pieData}
                            width={SCREEN_WIDTH - 30}
                            height={220}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            hasLegend={false}
                            absolute
                        />
                        <View style={styles.categoryList}>
                            {categoryList.map((cat, index) => (
                                <View key={index} style={styles.categoryItem}>
                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                        <View style={{width:12, height:12, borderRadius:6, backgroundColor: cat.color, marginRight:10}} />
                                        <Text style={styles.catName}>{cat.name}</Text>
                                    </View>
                                    <View style={{alignItems:'flex-end'}}>
                                        <Text style={styles.catDuration}>{formatMinutes(cat.duration)}</Text>
                                        <Text style={styles.catPercent}>%{cat.percentage}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                 ) : (
                    <Text style={styles.noDataText}>Henüz veri yok.</Text>
                 )}
            </View>
        )}

        {/* TARİHÇE */}
        {activeTab === 'History' && (
            <View>
                <Text style={styles.sectionTitle}>Son 7 Gün ({selectedCategory})</Text>
                <BarChart
                    data={chartData}
                    width={SCREEN_WIDTH - 30}
                    height={300}
                    yAxisLabel=""
                    yAxisSuffix=" dk"
                    chartConfig={{
                        ...chartConfig,
                        barPercentage: 0.7,
                    }}
                    style={{ borderRadius: 16, marginTop: 10 }}
                    showValuesOnTopOfBars={true}
                    fromZero
                />
            </View>
        )}

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { padding: 20, paddingBottom: 5, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  tabsContainer: { backgroundColor: '#fff', paddingVertical: 10 },
  tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: '#f1f5f9' },
  activeTabButton: { backgroundColor: '#2563eb' },
  tabText: { marginLeft: 6, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#fff' },
  filterContainer: { backgroundColor: '#fff', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, backgroundColor: '#fff' },
  activeFilterChip: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  filterText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  activeFilterText: { color: '#1e40af', fontWeight: '700' },
  contentContainer: { padding: 15 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  card: { width: '48%', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:5, elevation:2 },
  cardLabel: { fontSize: 13, color: '#64748b', marginTop: 5, fontWeight: '600' },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#333' },
  selectedDateCard: { backgroundColor: '#dcfce7', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#86efac' },
  selectedDateTitle: { fontSize: 14, color: '#166534', fontWeight: '600' },
  selectedDateValue: { fontSize: 18, color: '#14532d', fontWeight: 'bold', marginTop: 4 },
  hintText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 10 },
  categoryList: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 2 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  catName: { fontSize: 16, fontWeight: '500', color: '#334155' },
  catDuration: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  catPercent: { fontSize: 12, color: '#94a3b8' },
  noDataText: { textAlign: 'center', color: '#999', margin: 20 },
});