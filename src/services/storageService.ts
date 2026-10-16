import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Deck, DifficultyLevel, UserProgress } from '../types';
import { INITIAL_CARDS, INITIAL_DECKS, INITIAL_USER_PROGRESS } from '../constants/initialData';
import { calculateNextReview, calculateProgressUpdate } from '../utils/spacedRepetition';

const KEYS = {
  DECKS: '@reellearn_decks_v1',
  CARDS: '@reellearn_cards_v1',
  PROGRESS: '@reellearn_progress_v1',
};

export const StorageService = {
  /**
   * Initializes storage with seed data on first launch.
   */
  async initialize(): Promise<void> {
    try {
      const existingDecks = await AsyncStorage.getItem(KEYS.DECKS);
      if (!existingDecks) {
        await AsyncStorage.setItem(KEYS.DECKS, JSON.stringify(INITIAL_DECKS));
      }

      const existingCards = await AsyncStorage.getItem(KEYS.CARDS);
      if (!existingCards) {
        await AsyncStorage.setItem(KEYS.CARDS, JSON.stringify(INITIAL_CARDS));
      }

      const existingProgress = await AsyncStorage.getItem(KEYS.PROGRESS);
      if (!existingProgress) {
        await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(INITIAL_USER_PROGRESS));
      }
    } catch (error) {
      console.error('StorageService.initialize error:', error);
    }
  },

  /**
   * Decks CRUD
   */
  async getDecks(): Promise<Deck[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DECKS);
      if (!data) return INITIAL_DECKS;
      return JSON.parse(data);
    } catch {
      return INITIAL_DECKS;
    }
  },

  async saveDecks(decks: Deck[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.DECKS, JSON.stringify(decks));
    } catch (error) {
      console.error('StorageService.saveDecks error:', error);
    }
  },

  async addDeck(deck: Deck): Promise<void> {
    const decks = await this.getDecks();
    decks.unshift(deck);
    await this.saveDecks(decks);
  },

  /**
   * Cards CRUD
   */
  async getCards(): Promise<Card[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CARDS);
      if (!data) return INITIAL_CARDS;
      return JSON.parse(data);
    } catch {
      return INITIAL_CARDS;
    }
  },

  async saveCards(cards: Card[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
    } catch (error) {
      console.error('StorageService.saveCards error:', error);
    }
  },

  async addCard(card: Card): Promise<void> {
    const cards = await this.getCards();
    cards.unshift(card);
    await this.saveCards(cards);

    // Update deck cardCount
    const decks = await this.getDecks();
    const updatedDecks = decks.map(d => 
      d.id === card.deckId ? { ...d, cardCount: (d.cardCount || 0) + 1 } : d
    );
    await this.saveDecks(updatedDecks);
  },

  /**
   * Review a card: updates interval, next review timestamp, and user XP/streak.
   */
  async reviewCard(cardId: string, rating: DifficultyLevel): Promise<{
    updatedCard: Card;
    newProgress: UserProgress;
  }> {
    const cards = await this.getCards();
    const cardIndex = cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error(`Card with id ${cardId} not found`);
    }

    const currentCard = cards[cardIndex];
    const reviewStats = calculateNextReview(currentCard, rating);

    const updatedCard: Card = {
      ...currentCard,
      ...reviewStats,
      difficulty: rating,
    };

    cards[cardIndex] = updatedCard;
    await this.saveCards(cards);

    // XP calculation: Easy=15, Medium=10, Hard=5
    const xpReward = rating === 'easy' ? 15 : rating === 'medium' ? 10 : 5;
    const currentProgress = await this.getProgress();
    const newProgress = calculateProgressUpdate(currentProgress, xpReward);
    await this.saveProgress(newProgress);

    return { updatedCard, newProgress };
  },

  async toggleBookmark(cardId: string): Promise<boolean> {
    const cards = await this.getCards();
    const target = cards.find(c => c.id === cardId);
    if (!target) return false;

    target.isBookmarked = !target.isBookmarked;
    await this.saveCards(cards);
    return target.isBookmarked;
  },

  /**
   * User Progress
   */
  async getProgress(): Promise<UserProgress> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PROGRESS);
      if (!data) return INITIAL_USER_PROGRESS;
      return JSON.parse(data);
    } catch {
      return INITIAL_USER_PROGRESS;
    }
  },

  async saveProgress(progress: UserProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('StorageService.saveProgress error:', error);
    }
  },

  async addXP(amount: number): Promise<UserProgress> {
    const current = await this.getProgress();
    const updated = calculateProgressUpdate(current, amount);
    await this.saveProgress(updated);
    return updated;
  },

  async resetAll(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.DECKS);
    await AsyncStorage.removeItem(KEYS.CARDS);
    await AsyncStorage.removeItem(KEYS.PROGRESS);
    await this.initialize();
  },
};
