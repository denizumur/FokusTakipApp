
-----

# Mobil Verimlilik ve Odaklanma Uygulaması

Bu proje, mobil uygulama geliştirme süreçlerini, bileşen tabanlı mimariyi ve yerel veri yönetimini pratik etmek amacıyla geliştirilmiş; **React Native** tabanlı bir odaklanma ve zaman yönetimi uygulamasıdır.

Uygulama, **Pomodoro Tekniği** prensiplerini temel alarak, kullanıcıların çalışma sürelerini takip etmelerini, performans verilerini grafiksel olarak analiz etmelerini ve sürdürülebilir çalışma alışkanlıkları kazanmalarını hedefler.

## 📑 İçindekiler

  - [Proje Amacı]
  - [Kullanılan Teknolojiler]
  - [Sistem Mimarisi ve Dosya Yapısı]
  - [Uygulama Modülleri]
  - [Veri Modeli]
  - [Kurulum ve Çalıştırma]

-----

## 🎯 Proje Amacı

Günümüz dijital dünyasında artan dikkat dağınıklığı problemine çözüm üretmek amacıyla geliştirilen **Focus Flow**, aşağıdaki teknik kazanımları sağlamayı amaçlamaktadır:

  * **React Native** ekosistemine ve **Expo** altyapısına hakimiyet.
  * **Context API** ile global durum (state) yönetimi.
  * **AsyncStorage** kullanarak kalıcı veri depolama (Data Persistence).
  * **SVG** ve **Canvas** teknolojileri ile özel UI bileşenlerinin (Custom UI) geliştirilmesi.
  * **AppState** API ile uygulama yaşam döngüsü (Lifecycle) yönetimi.

-----

## 🛠 Kullanılan Teknolojiler

Proje geliştirme sürecinde performans ve ölçeklenebilirlik esas alınmıştır.

| Kategori | Teknoloji / Kütüphane | Kullanım Alanı |
| **Core** | React Native (Expo SDK 50) | Mobil Uygulama Çatısı |
| **Language** | JavaScript (ES6+) | Uygulama Mantığı |
| **State Management** | React Context API | Tema ve Veri Akışı Yönetimi |
| **Storage** | Async Storage | Yerel Veritabanı (JSON Tabanlı) |
| **Visualization** | React Native SVG | Dairesel İlerleme Çubuğu (Timer) |
| **Analytics** | React Native Chart Kit | Veri Görselleştirme ve Grafikler |
| **UX** | Haptic Feedback | Dokunsal Geri Bildirim |

-----

## 🏗 Sistem Mimarisi ve Dosya Yapısı

Proje, **Modüler Mimarisi (Modular Architecture)** prensiplerine göre yapılandırılmıştır.

```text
focus-flow/
├── src/
│   ├── components/      # Yeniden kullanılabilir UI bileşenleri (StatCard, CustomModal vb.)
│   ├── context/         # Global state yönetimi (FocusContext)
│   ├── screens/         # Uygulama ekranları (Focus, Report, Settings)
│   ├── utils/           # Yardımcı fonksiyonlar ve Depolama (Storage) işlemleri
│   └── navigation/      # Navigasyon yapılandırması
├── App.js               # Kök bileşen
└── package.json         # Bağımlılıklar
```

-----

## 📱 Uygulama Modülleri

### 1\. Odaklanma Modülü (Focus Screen)

Kullanıcının çalışma oturumlarını yönettiği ana modüldür.

  * **Dairesel Sayaç:** `react-native-svg` kullanılarak geliştirilen, matematiksel hesaplamalarla (Trigonometri) yönetilen dinamik ilerleme çubuğu.
  * **Arka Plan Takibi:** `AppState` API entegrasyonu ile uygulamanın arka plana atılması durumunda "Dikkat Dağınıklığı" (Distraction) tespiti yapılır.
  * **Kategori Seçimi:** Native elementler yerine, özelleştirilmiş **Modal** yapısı ile kategori filtreleme imkanı sunar.

### 2\. Raporlama Modülü (Report Screen)

Toplanan verilerin işlenerek anlamlı grafiklere dönüştürüldüğü analiz ekranıdır.

  * **Optimizasyon:** Büyük veri setlerinin listelenmesinde performans kaybını önlemek için `ScrollView` yerine **`FlatList`** kullanılmıştır.
  * **Görselleştirme:** Isı Haritası (Heatmap), Pasta Grafik (Pie Chart) ve Çubuk Grafik (Bar Chart) bileşenleri entegre edilmiştir.
  * **Veri Filtreleme:** Kullanıcı verileri zamana ve kategoriye göre dinamik olarak filtreleyebilir.

### 3\. Ayarlar Modülü (Settings Screen)

  * **Tema Yönetimi:** Uygulama genelinde geçerli olan Karanlık/Aydınlık mod desteği.
  * **Veri Yönetimi:** Kullanıcı verilerinin güvenli bir şekilde sıfırlanması işlemleri.

-----

## 💾 Veri Modeli

Uygulama, verileri ilişkisel olmayan bir yapıda, JSON formatında yerel cihaz hafızasında saklar. Örnek veri şeması aşağıdadır:

```json
[
  {
    "id": 1702829102391,
    "date": "2025-12-15T14:30:00.000Z",
    "duration": 1500,
    "category": "Kodlama",
    "pauseCount": 2,
    "distractions": 1
  }
]
```

-----

## 🔄 İş Akış Şeması

Kullanıcı etkileşiminin veri tabanına yansıması aşağıdaki akış diyagramında özetlenmiştir:

1.  **Giriş:** Kullanıcı süre ve kategori seçimi yapar.
2.  **İşlem:** Sayaç başlatılır. Arka plan aktiviteleri ve duraklatmalar dinlenir.
3.  **Sonuç:** Süre tamamlandığında oturum verileri (süre, mola, dikkat dağınıklığı) derlenir.
4.  **Kayıt:** Veri `AsyncStorage`'a asenkron olarak yazılır.
5.  **Analiz:** Rapor ekranındaki grafikler yeni veri setiyle güncellenir.

-----

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

1.  **Depoyu Klonlayın:**

    ```bash
    git clone https://github.com/denizumur/FokusTakipApp
    cd FocusTakipApp
    ```

2.  **Bağımlılıkları Yükleyin:**

    ```bash
    npm install
    ```

3.  **Uygulamayı Başlatın:**

    ```bash
    npx expo start -c
    ```

-----
