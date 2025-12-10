import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, ContributionGraph, PieChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocus } from '../context/FocusContext'; // CONTEXT BAĞLANTISI
import { getSessions } from '../utils/storage';
// ------------------------------------------------------------------
// YENİ: Harici StatCard bileşenini import ediyoruz
import StatCard from '../components/StatCard';
// ------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLORS = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6'];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useFocus(); // TEMAYI ÇEKİYORUZ

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Summary'); 
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  const [allSessions, setAllSessions] = useState([]);
  const [uniqueCategories, setUniqueCategories] = useState(['Tümü']);

  const [stats, setStats] = useState({ today: 0, total: 0, totalDistractions: 0, totalPauses: 0 });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [0] }] });
  const [pieData, setPieData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [categoryList, setCategoryList] = useState([]);

  // --- VERİ ÇEKME VE İŞLEME (AYNI MANTIK) ---
  const fetchSessions = async () => {
      setLoading(true);
      const sessions = await getSessions();
      setAllSessions(sessions);
      const cats = new Set(sessions.map(s => s.category));
      setUniqueCategories(['Tümü', ...Array.from(cats)]);
      processData(sessions, selectedCategory);
      setLoading(false);
  };

  const processData = (sessions, categoryFilter) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const filteredSessions = categoryFilter === 'Tümü' ? sessions : sessions.filter(s => s.category === categoryFilter);

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

    // Bar Chart
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

    // Heatmap
    const hData = Object.keys(heatmapMap).map(date => ({ date, count: heatmapMap[date] }));
    setHeatmapData(hData);

    // Pie Chart
    const categoryMap = {};
    sessions.forEach(s => {
        const cat = s.category || "Diğer";
        categoryMap[cat] = (categoryMap[cat] || 0) + s.duration;
    });

    const pData = Object.keys(categoryMap).map((cat, index) => ({
      name: cat,
      population: parseFloat((categoryMap[cat] / 60).toFixed(1)),
      color: COLORS[index % COLORS.length],
      legendFontColor: theme === 'dark' ? '#ccc' : '#555', // Dinamik renk
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

    if (selectedDateInfo) {
        const updatedEntry = hData.find(h => h.date === selectedDateInfo.date);
        setSelectedDateInfo(updatedEntry ? { date: selectedDateInfo.date, count: updatedEntry.count } : { date: selectedDateInfo.date, count: 0 });
    }
  };

  const handleCategoryChange = (cat) => { setSelectedCategory(cat); processData(allSessions, cat); };

  useFocusEffect(useCallback(() => { fetchSessions(); }, [theme])); // Tema değişince yenile
  const formatMinutes = (seconds) => `${Math.floor(seconds / 60)} dk`;

  // --- DİNAMİK GRAFİK AYARLARI ---
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme === 'dark' ? `rgba(0, 243, 255, ${opacity})` : `rgba(37, 99, 235, ${opacity})`, // Neon vs Mavi
    labelColor: (opacity = 1) => colors.text, // Yazılar temaya göre
    propsForBackgroundLines: {
        strokeDasharray: "", // Düz çizgi
        stroke: theme === 'dark' ? "#333" : "#eee" // Çizgiler silik
    }
  };

  // --- BİLEŞENLER ---
  const TabButton = ({ title, activeId, icon }) => (
    <TouchableOpacity 
        style={[
            styles.tabButton, 
            { backgroundColor: activeTab === activeId ? colors.primary : colors.card, borderColor: colors.border, borderWidth: 1 }
        ]}
        onPress={() => setActiveTab(activeId)}
    >
        <Ionicons name={icon} size={18} color={activeTab === activeId ? (theme === 'dark' ? '#000' : '#fff') : colors.text} />
        <Text style={[
            styles.tabText, 
            { color: activeTab === activeId ? (theme === 'dark' ? '#000' : '#fff') : colors.text }
        ]}>{title}</Text>
    </TouchableOpacity>
  );

  const FilterChip = ({ title }) => (
      <TouchableOpacity 
        style={[
            styles.filterChip, 
            { 
                borderColor: selectedCategory === title ? colors.primary : colors.border,
                backgroundColor: selectedCategory === title ? (theme === 'dark' ? '#1a1a1a' : '#dbeafe') : colors.card 
            }
        ]}
        onPress={() => handleCategoryChange(title)}
      >
          <Text style={[
              styles.filterText, 
              { color: selectedCategory === title ? colors.primary : colors.text }
          ]}>
            {title}
          </Text>
      </TouchableOpacity>
  );

// ------------------------------------------------------------------
// ESKİ StatCard tanımı bu alandan SİLİNDİ.
// ------------------------------------------------------------------

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      
      <View style={[styles.headerContainer, { backgroundColor: colors.bg }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>📊 Analizler</Text>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15}}>
            <TabButton title="Özet" activeId="Summary" icon="grid-outline" />
            <TabButton title="Alışkanlık" activeId="Heatmap" icon="calendar-outline" />
            <TabButton title="Kategoriler" activeId="Categories" icon="pie-chart-outline" />
            <TabButton title="Tarihçe" activeId="History" icon="bar-chart-outline" />
        </ScrollView>
      </View>

      {activeTab !== 'Categories' && (
        <View style={[styles.filterContainer, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15}}>
                {uniqueCategories.map((cat, index) => (
                    <FilterChip key={index} title={cat} />
                ))}
            </ScrollView>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]} 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSessions} tintColor={colors.primary} />}
      >
        
        {/* ÖZET */}
        {activeTab === 'Summary' && (
            <View style={styles.gridContainer}>
                {/* Büyük Kart (Manuel olarak burada tutulur) */}
                <View style={[styles.card, { width: '100%', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.cardLabel, { color: colors.text }]}>{selectedCategory === 'Tümü' ? 'Toplam Odaklanma' : `${selectedCategory} Süresi`}</Text>
                    <Text style={[styles.cardValue, { fontSize: 36, color: colors.primary }]}>{formatMinutes(stats.total)}</Text>
                    <Text style={{color: colors.text, opacity: 0.6, marginTop:5}}>Bugün: {formatMinutes(stats.today)}</Text>
                </View>

                {/* Küçük Kartlar - StatCard Component Kullanımı */}
                <StatCard 
                    label="Dağınıklık" 
                    value={stats.totalDistractions} 
                    icon="alert-circle" 
                    color="#ef4444" 
                    colors={colors} // Renk paletini yolluyoruz
                />
                <StatCard 
                    label="Duraklatma" 
                    value={stats.totalPauses} 
                    icon="pause-circle" 
                    color="#f59e0b" 
                    colors={colors} // Renk paletini yolluyoruz
                />
            </View>
        )}

        {/* HEATMAP */}
        {activeTab === 'Heatmap' && (
            <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {selectedCategory === 'Tümü' ? 'Genel Alışkanlık' : `${selectedCategory} Alışkanlığı`}
                </Text>
                <View style={[styles.selectedDateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.selectedDateTitle, { color: colors.primary }]}>
                        {selectedDateInfo ? new Date(selectedDateInfo.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tarih Seçin'}
                    </Text>
                    <Text style={[styles.selectedDateValue, { color: colors.text }]}>
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
                            color: (opacity = 1) => theme === 'dark' ? `rgba(52, 211, 153, ${opacity})` : `rgba(22, 163, 74, ${opacity})`, // Neon Yeşil vs Koyu Yeşil
                            backgroundGradientFrom: colors.card,
                            backgroundGradientTo: colors.card,
                        }}
                        onDayPress={(day) => setSelectedDateInfo(day)}
                        gutterSize={2}
                    />
                </View>
            </View>
        )}

        {/* KATEGORİLER */}
        {activeTab === 'Categories' && (
            <View>
                 <Text style={[styles.sectionTitle, { color: colors.text }]}>Tüm Zamanların Dağılımı</Text>
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
                        <View style={[styles.categoryList, { backgroundColor: colors.card }]}>
                            {categoryList.map((cat, index) => (
                                <View key={index} style={[styles.categoryItem, { borderBottomColor: colors.border }]}>
                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                        <View style={{width:12, height:12, borderRadius:6, backgroundColor: cat.color, marginRight:10}} />
                                        <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                                    </View>
                                    <View style={{alignItems:'flex-end'}}>
                                        <Text style={[styles.catDuration, { color: colors.text }]}>{formatMinutes(cat.duration)}</Text>
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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Son 7 Gün ({selectedCategory})</Text>
                <BarChart
                    data={chartData}
                    width={SCREEN_WIDTH - 30}
                    height={300}
                    yAxisLabel=""
                    yAxisSuffix=" dk"
                    chartConfig={chartConfig}
                    style={{ borderRadius: 16, marginTop: 10 }}
                    showValuesOnTopOfBars={true}
                    fromZero
                />
            </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { padding: 20, paddingBottom: 5 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  tabsContainer: { paddingVertical: 10 },
  tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10 },
  tabText: { marginLeft: 6, fontWeight: '600' },
  filterContainer: { paddingBottom: 10, borderBottomWidth: 1 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 13, fontWeight: '500' },
  contentContainer: { padding: 15 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  card: { width: '48%', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  cardLabel: { fontSize: 13, marginTop: 5, fontWeight: '600' },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  selectedDateCard: { padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1 },
  selectedDateTitle: { fontSize: 14, fontWeight: '600' },
  selectedDateValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  categoryList: { marginTop: 20, borderRadius: 12, padding: 15, elevation: 2 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  catName: { fontSize: 16, fontWeight: '500' },
  catDuration: { fontSize: 16, fontWeight: 'bold' },
  catPercent: { fontSize: 12, color: '#94a3b8' },
  noDataText: { textAlign: 'center', color: '#999', margin: 20 },
});