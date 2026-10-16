# 📱 ReelLearn — Vertical Micro-Learning Mobile App
### *Next-Generation Mobile Learning Platform Combining TikTok-Style Feeds with Spaced Repetition, Active Recall & General Knowledge*

[![React Native](https://img.shields.io/badge/Framework-React%20Native-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Platform-Expo-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Target](https://img.shields.io/badge/Target-iOS%20%7C%20Android-green.svg)](#)

---

## 📌 Project Overview

**ReelLearn** is an open-source mobile learning application designed for university students and lifelong learners, transforming traditional, static flashcards into an addictive **TikTok / Instagram Reels-style vertical feed experience**.

Instead of fighting mobile screen time habits, ReelLearn leverages them: merging seamless, swipe-based vertical browsing with evidence-based cognitive psychology principles—primarily **Spaced Repetition** and **Active Recall**—while offering both **Course-Specific Study** and **Curated General Knowledge (Trivia)** discovery feeds.

---

## 🧠 Scientific & Pedagogical Foundations

| Learning Method | Description | Scientific Reference |
| :--- | :--- | :--- |
| **Spaced Repetition** | Scheduling reviews at scientifically calculated intervals just before the information is forgotten. Hard concepts appear frequently; easy ones appear spaced out. | *Hermann Ebbinghaus (Forgetting Curve), Sebastian Leitner (Box System), SuperMemo Algorithm* |
| **Active Recall** | Testing memory retrieval actively instead of passive reading. Users ponder the concept before flipping the card, supplemented with periodic mini-tests. | *Roediger & Karpicke (2006) — The Power of Testing Memory* |
| **Micro-Learning** | Chunking complex subject notes into high-impact, 15–30 second digestible bites. | *Cognitive Load Theory (John Sweller)* |
| **Gamification & Habit Loops** | Daily streaks, XP points, and achievement badges to establish long-term study habits rather than cramming. | *Yu-kai Chou — Octalysis Framework* |

---

## ✨ Key Features

- 🔄 **TikTok-Style Dual Header Tabs ("My Studies" vs. "For You / General Knowledge"):**
  - **My Studies (Study Feed):** Rigorous, spaced-repetition flashcards from your enrolled university courses (e.g., Python, Linear Algebra, Data Structures).
  - **For You (General Knowledge / Genel Kültür):** Inspiring, bite-sized trivia cards spanning science, world history, arts, technology, geography, and fun facts.
- 📱 **Vertical Learning Feed (Reels-style):** Full-screen interactive cards. Swipe up for the next concept, tap to reveal answers with smooth 3D flip animations.
- 🎯 **"Understood" vs. "Review Again" Feedback:** Real-time feedback alters the card's interval and repetition weight.
- 🧩 **In-Feed Mini Quizzes:** Quick, interactive multiple-choice checkpoints appearing every 5–10 cards to reinforce retention.
- 📚 **Course & Topic Decks:** Organize study content by subjects and filter the feed dynamically.
- ✍️ **Custom Deck & Card Creator:** Create custom cards with syntax-highlighted code snippets and markdown text.
- 📊 **Progress & Analytics:** Track study streaks, cards mastered, daily targets, and subjects requiring reinforcement.
- 💾 **Offline-First Storage:** Fast, persistent local storage via AsyncStorage / SQLite ensuring zero network latency.
- 🎨 **Modern, High-Contrast UI:** Built with sleek dark mode aesthetics, intuitive micro-animations, and accessible touch targets.

---

## 📱 Screen Architecture & User Flow

The application satisfies academic project criteria with **5 core screens and dedicated interaction flows**:

```mermaid
graph TD
    A["Main Feed Screen"] -->|"Top Tab Switcher"| B["My Studies (Course Feed)"]
    A -->|"Top Tab Switcher"| C["For You (General Knowledge / Trivia)"]
    B -->|"Every 5-10 Cards"| D["In-Feed Mini Quiz"]
    C -->|"Save to Review"| E["Bookmarked Facts"]
    B -->|"Review Status"| F["Spaced Repetition Engine"]
    G["Deck & Course Manager"] -->|"Select / Create"| B
    H["Profile & Analytics"] -->|"Track Habits"| I["Daily Streak & XP Badges"]
```

1. **Feed Screen (`FeedScreen`):** Full-screen vertical paging with a top dual-tab header (*My Studies* \| *For You*), tap-to-flip card animation, difficulty ratings (*Easy*, *Good*, *Hard*).
2. **Decks & Categories (`DeckListScreen` & `DeckDetailScreen`):** Browse topics, view card counts, manage study sets, and toggle General Knowledge topics.
3. **Mini Quiz Module (`QuizScreen`):** Multiple-choice knowledge validation triggered dynamically within the feed or on demand.
4. **Profile & Analytics (`ProfileScreen`):** Daily goals, consecutive day streak counters, mastery rates, and weak-topic analysis.
5. **Card Creator (`CreateCardScreen`):** Fast creation interface for adding custom notes, code snippets, trivia facts, and answers.

---

## 🛠 Technology Stack

- **Core Framework:** [React Native](https://reactnative.dev/) (v0.74+) with [Expo](https://expo.dev/) (SDK 51+)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict type safety and maintainable codebase)
- **Navigation:** [React Navigation](https://reactnavigation.org/) (Native Stack & Bottom Tabs)
- **Animations & Gestures:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) & [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- **Local Persistence:** `@react-native-async-storage/async-storage` (Offline-first data persistence)
- **Icons:** `@expo/vector-icons` (Feather, Ionicons)
- **Date Calculations:** `date-fns` (Spaced repetition intervals and streak logic)

---

## 🗄 Data Model Schemas

```typescript
// Feed Type (Dual-tab feed switcher)
type FeedType = 'study' | 'general_knowledge';

// Deck Model
interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  cardCount: number;
  isGeneralKnowledge?: boolean;
  createdAt: number;
}

// Flashcard Model
interface Card {
  id: string;
  deckId: string;
  type: FeedType;         // 'study' for course decks or 'general_knowledge' for trivia
  topic?: string;         // e.g., 'Science', 'History', 'Technology', 'Geography'
  front: string;          // Question, concept, or trivia prompt
  back: string;           // Explanation, fact, or solution
  codeSnippet?: string;   // Optional syntax code snippet
  difficulty: 'easy' | 'medium' | 'hard';
  repetitionCount: number;
  intervalDays: number;
  nextReviewDate: number; // Unix timestamp
  isBookmarked: boolean;
}

// User Progress & Gamification Model
interface UserProgress {
  streak: number;
  lastStudiedDate: string; // Format: YYYY-MM-DD
  dailyGoal: number;
  todayCompletedCount: number;
  totalCardsReviewed: number;
  xp: number;
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm, yarn, or pnpm
- **Expo Go** mobile app on your physical device (available on iOS App Store & Google Play Store)

### 1. Clone the Repository
```bash
git clone https://github.com/Hkantosun/Mobile_application_project.git
cd Mobile_application_project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npx expo start
```

### 4. Run on Device / Simulator
- Scan the printed **QR code** in your terminal using the Camera app (iOS) or the Expo Go app (Android).
- Or press `i` for iOS Simulator / `a` for Android Emulator on macOS.

---

## 📁 Planned Project Structure

```text
├── assets/                 # Brand assets, logos, and custom fonts
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── FeedHeaderTabs.tsx # TikTok-style dual switcher ('My Studies' | 'For You')
│   │   ├── CardItem.tsx    # Full-screen vertical swipeable card
│   │   ├── FlipCard.tsx    # Smooth 3D card flip animation
│   │   ├── QuizItem.tsx    # Interactive multiple-choice item
│   │   └── StreakBadge.tsx # Gamification streak & XP badges
│   ├── screens/            # Application screen components
│   │   ├── FeedScreen.tsx  # Dual feed (Study & General Knowledge)
│   │   ├── DeckListScreen.tsx
│   │   ├── CreateCardScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/         # React Navigation stacks & bottom tabs
│   ├── services/           # AsyncStorage persistence layer
│   ├── utils/              # Spaced repetition algorithms (SM-2 / Leitner)
│   ├── types/              # TypeScript types & interface declarations
│   └── constants/          # Preloaded course decks & general knowledge trivia
├── App.tsx                 # Main application root
├── app.json                # Expo configuration file
├── package.json
└── tsconfig.json
```

---

## 🗺 Roadmap

- [x] Comprehensive architecture documentation & technical specification ([README.md](README.md))
- [x] Dual-tab feed concept added: Study Feed vs. General Knowledge (For You)
- [x] Initialize Expo + TypeScript foundation
- [x] Implement Spaced Repetition engine (`spacedRepetition.ts`) and data contracts
- [x] Develop local offline persistence layer (`storageService.ts`)
- [x] Build vertical full-screen Reels feed (`FeedScreen`) with `FeedHeaderTabs` and flip animations
- [x] Preload curated General Knowledge trivia pack (Science, History, Tech, Art)
- [x] Implement in-feed Active Recall Mini Quizzes (`QuizModal`)
- [x] Build Deck manager and custom Card creation screens (`DeckListScreen`, `CreateCardScreen`)
- [x] Implement User Profile, daily study streaks, and visual analytics (`ProfileScreen`)
- [ ] *Future Scope:* AI-driven automatic flashcard generation from uploaded lecture notes/PDFs via LLM integration

---

## 📄 License

Distributed under the [MIT License](LICENSE).
