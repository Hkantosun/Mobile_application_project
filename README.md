# 📱 ReelLearn — Dikey Akışlı Mobil Öğrenme Platformu
### *TikTok Deneyimini Aralıklı Tekrar ve Aktif Hatırlama ile Birleştiren Yeni Nesil Eğitim Uygulaması*

[![React Native](https://img.shields.io/badge/Framework-React%20Native-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Platform-Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Target](https://img.shields.io/badge/Target-iOS%20%7C%20Android-green.svg)](#)

---

## 📌 Proje Genel Bakışı

**ReelLearn**, üniversite öğrencilerinin ve sınavlara hazırlanan bireylerin geleneksel, monoton bilgi kartı (flashcard) deneyimini **TikTok / Instagram Reels** mekaniğiyle yeniden tanımlayan açık kaynaklı bir mobil öğrenme uygulamasıdır. 

Kullanıcıların günlük telefon kullanım alışkanlıklarını (sonsuz dikey kaydırma) bilişsel psikolojinin en güçlü iki öğrenme prensibi olan **Aralıklı Tekrar (Spaced Repetition)** ve **Aktif Geri Çağırma (Active Recall)** ile harmanlar.

---

## 🧠 Bilimsel ve Pedagojik Temeller

| Yöntem | Açıklama | Bilimsel Referans |
| :--- | :--- | :--- |
| **Aralıklı Tekrar (Spaced Repetition)** | Bilginin unutulma eğrisine (Ebbinghaus) göre tam unutulmak üzereyken tekrar gösterilmesi. Kolay kartlar seyrek, zor kartlar sık gösterilir. | *Ebbinghaus (1885), Leitner Kutusu & SuperMemo Algoritması* |
| **Aktif Geri Çağırma (Active Recall)** | Pasif okuma yerine beyni cevabı hatırlamaya zorlama. Bilgi kartının arkasını çevirme ve aralara serpiştirilmiş Mini Test adımları. | *Roediger & Karpicke (2006) — Test Yaparak Öğrenme Etkisi* |
| **Mikro-Öğrenme (Micro-learning)** | Yoğun ders notlarını 15-30 saniyede tüketilebilir, odaklanmış bilgi parçacıklarına bölme. | *Kısa Süreli Bellek ve Bilişsel Yük Teorisi (Sweller)* |
| **Oyunlaştırma (Gamification)** | Günlük çalışma serisi (Streak), XP kazanımı ve başarı rozetleri ile sürdürülebilir alışkanlık döngüsü oluşturma. | *Yu-kai Chou — Octalysis Çerçevesi* |

---

## ✨ Temel Özellikler

- 🔄 **Dikey Kaydırmalı Öğrenme Akışı (Reels Feed):** Tam ekran boyutunda kartlar; yukarı kaydırarak sonraki bilgiye geçiş, dokunarak cevabı ortaya çıkarma animasyonu.
- 🎯 **"Anladım" & "Tekrar Et" Değerlendirmesi:** Kullanıcının her karta verdiği geri bildirime göre aralıklı tekrar sıklığını dinamik ayarlama.
- 🧩 **Araya Giren Mini Testler (Quiz In-Feed):** Her 5-10 kartta bir karşısına çıkan çoktan seçmeli sorularla anlık geri çağırma pratiği.
- 📚 **Ders ve Konu Kategorileri (Decks):** Python, Lineer Cebir, Algoritmalar, Yabancı Dil vb. ders bazlı dikey ayrıştırma.
- ✍️ **Kendi Kartını / Desteni Oluştur:** Notlardan doğrudan soru-cevap çiftleri ekleyebilme.
- 📊 **Detaylı İlerleme ve İstatistikler:** Günlük tamamlanan kart sayısı, aktif seri (streak), başarı oranı ve en çok zorlanılan kavramların analizi.
- 💾 **Çevrimdışı Öncelikli Yerel Depolama (Offline-First):** AsyncStorage / SQLite altyapısıyla internetsiz ortamda bile kesintisiz çalışma.
- 🎨 **Modern & Yüksek Kontrastlı UI:** Karanlık mod (Dark mode) desteği, modern tipografi ve geniş dokunma hedefleri.

---

## 📱 Ekran Mimarisi

Uygulama ders projesi standartlarına uygun olarak en az **4 ana modül ve 5 ekran** içerir:

```mermaid
graph TD
    A[Giriş / Kategori Seçimi] --> B[Dikey Kart Akışı (Feed Screen)]
    B -->|Her 5-10 Kartta Bir| C[Mini Test / Quiz Ekranı]
    B -->|Kartı Kaydet| D[Kaydedilenler & Zor Kartlar]
    A --> E[Yeni Deste / Kart Ekleme]
    A --> F[Profil & İstatistikler (Streak & İlerleme)]
```

1. **Akış Ekranı (`FeedScreen`):** TikTok benzeri tam ekran dikey kaydırma, kart çevirme, sesli/görsel ipucu, *Anladım / Kolay / Tekrar* aksiyonları.
2. **Kategori & Deste Yönetimi (`DeckListScreen` & `DeckDetailScreen`):** Derslerin listelendiği, yeni konu ve kartların eklenebildiği alan.
3. **Mini Test Ekranı (`QuizScreen`):** Akış esnasında veya isteğe bağlı açılan çoktan seçmeli aktif test ekranı.
4. **İlerleme & Profil Ekranı (`ProfileScreen`):** Günlük hedef takibi, gün serisi (streak sayacı), toplam öğrenilen kartlar, zayıf noktalar.
5. **Kart Ekleme / Not Yükleme (`CreateCardScreen`):** Notlardan hızlı kart türetme ve düzenleme arayüzü.

---

## 🛠 Teknoloji Yığını

- **Çekirdek:** [React Native](https://reactnative.dev/) (v0.74+) + [Expo](https://expo.dev/) (SDK 51+)
- **Dil:** [TypeScript](https://www.typescriptlang.org/) (Tip güvenliği ve temiz kod mimarisi)
- **Navigasyon:** [React Navigation](https://reactnavigation.org/) (Native Stack & Bottom Tabs)
- **Animasyonlar & Hareketler:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) & [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- **Yerel Depolama:** `@react-native-async-storage/async-storage` (Çevrimdışı veri kalıcılığı)
- **İkonlar:** `@expo/vector-icons` (Feather, Ionicons)
- **Tarih & Zaman Hesaplaması:** `date-fns` (Aralıklı tekrar zaman damgaları)

---

## 🗄 Veri Modeli Mimarisi

```typescript
// Deste (Deck)
interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  cardCount: number;
  createdAt: number;
}

// Bilgi Kartı (Card)
interface Card {
  id: string;
  deckId: string;
  front: string;          // Soru veya kavram
  back: string;           // Cevap veya açıklama
  codeSnippet?: string;   // Opsiyonel kod bloğu
  difficulty: 'easy' | 'medium' | 'hard';
  repetitionCount: number;
  intervalDays: number;
  nextReviewDate: number; // Unix zaman damgası
  isBookmarked: boolean;
}

// Kullanıcı İlerlemesi (Progress)
interface UserProgress {
  streak: number;
  lastStudiedDate: string; // YYYY-MM-DD
  dailyGoal: number;
  todayCompletedCount: number;
  totalCardsReviewed: number;
  xp: number;
}
```

---

## 🚀 Kurulum ve Çalıştırma Rehberi

### Gereksinimler
- Node.js (v18.0.0 veya üstü)
- npm veya yarn / pnpm
- Mobil cihazınızda **Expo Go** uygulaması (iOS App Store veya Google Play Store)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/Hkantosun/Mobile_application_project.git
cd Mobile_application_project
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npx expo start
```

### 4. Uygulamayı Cihazda Görüntüleyin
- Terminalde açılan **QR kodunu** telefonunuzun kamerası (iOS) veya Expo Go (Android) ile taratın.
- Alternatif olarak Mac ortamında iOS Simülatörü için `i`, Android Emülatör için `a` tuşuna basın.

---

## 📁 Planlanan Dizin Yapısı

```text
├── assets/                 # Görseller, logolar ve yazı tipleri
├── src/
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri
│   │   ├── CardItem.tsx    # Tam ekran dikey kaydırılan kart
│   │   ├── FlipCard.tsx    # Kart çevirme animasyon bileşeni
│   │   ├── QuizItem.tsx    # Mini test soru bileşeni
│   │   └── StreakBadge.tsx # Seri ve istatistik rozetleri
│   ├── screens/            # Uygulama ekranları
│   │   ├── FeedScreen.tsx
│   │   ├── DeckListScreen.tsx
│   │   ├── CreateCardScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/         # Navigation yapılandırması (Tabs & Stack)
│   ├── services/           # Depolama ve veri servisleri (AsyncStorage)
│   ├── utils/              # Spaced repetition algoritması ve yardımcılar
│   ├── types/              # TypeScript tip tanımları
│   └── constants/          # Renk paleti, temalar ve mock veriler
├── App.tsx                 # Ana uygulama başlangıç noktası
├── app.json                # Expo konfigürasyonu
├── package.json
└── tsconfig.json
```

---

## 🗺 Yol Haritası (Roadmap)

- [x] Detaylı mimari dokümantasyonu ve proje planının hazırlanması (README.md)
- [ ] Expo + TypeScript çekirdek projesinin kurulması
- [ ] Aralıklı Tekrar algoritması (`spacedRepetition.ts`) ve veri modellerinin kodlanması
- [ ] AsyncStorage yerel depolama katmanının (`storageService.ts`) yazılması
- [ ] Dikey tam ekran Reels akışı (`FeedScreen`) ve kart çevirme animasyonunun geliştirilmesi
- [ ] Araya giren Mini Test (`QuizScreen`) modülünün eklenmesi
- [ ] Kategori ve kart ekleme ekranlarının tamamlanması
- [ ] İlerleme, Streak ve başarı ekranının kodlanması
- [ ] *Gelecek Aşama:* PDF/Not yükleme ve LLM (OpenAI) ile otomatik kart üretme modülü

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) kapsamında lisanslanmıştır.
