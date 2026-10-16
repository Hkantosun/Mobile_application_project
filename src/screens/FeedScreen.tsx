import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { CardItem } from '../components/CardItem';
import { FeedHeaderTabs } from '../components/FeedHeaderTabs';
import { QuizModal } from '../components/QuizModal';
import { StorageService } from '../services/storageService';
import { Card, DifficultyLevel, FeedType, QuizQuestion, UserProgress } from '../types';
import { THEME } from '../constants/theme';
import { INITIAL_USER_PROGRESS } from '../constants/initialData';

export const FeedScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation }) => {
  const [activeFeed, setActiveFeed] = useState<FeedType>('study');
  const [cards, setCards] = useState<Card[]>([]);
  const [progress, setProgress] = useState<UserProgress>(INITIAL_USER_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Measure window dimensions for full-screen paging
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: any; screen: any }) => {
      setWindowDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Filter deckId if passed via navigation params
  const targetDeckId = route?.params?.deckId;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await StorageService.initialize();
      const loadedCards = await StorageService.getCards();
      const loadedProgress = await StorageService.getProgress();
      setCards(loadedCards);
      setProgress(loadedProgress);
    } catch (error) {
      console.error('Failed to load feed data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation?.addListener?.('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  // Feed items filtering based on dual tabs and filters
  const filteredCards = useMemo(() => {
    let result = cards.filter(c => c.type === activeFeed);

    if (targetDeckId) {
      result = result.filter(c => c.deckId === targetDeckId);
    }

    if (showBookmarksOnly) {
      result = result.filter(c => c.isBookmarked);
    }

    return result;
  }, [cards, activeFeed, targetDeckId, showBookmarksOnly]);

  const handleReview = async (cardId: string, rating: DifficultyLevel) => {
    try {
      const { updatedCard, newProgress } = await StorageService.reviewCard(cardId, rating);
      setCards(prev => prev.map(c => (c.id === cardId ? updatedCard : c)));
      setProgress(newProgress);
    } catch (error) {
      console.error('Review failed:', error);
    }
  };

  const handleToggleBookmark = async (cardId: string) => {
    try {
      const isBookmarked = await StorageService.toggleBookmark(cardId);
      setCards(prev =>
        prev.map(c => (c.id === cardId ? { ...c, isBookmarked } : c))
      );
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
    }
  };

  const handleQuizSuccess = async () => {
    try {
      const updated = await StorageService.addXP(25);
      setProgress(updated);
    } catch (error) {
      console.error('Quiz XP update failed:', error);
    }
  };

  // Usable height for the card item (Window height minus status bar, header, and bottom nav)
  const feedItemHeight = windowDimensions.height - 150;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>ReelLearn Akışı Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* TikTok-Style Dual Header Tabs */}
      <FeedHeaderTabs
        activeFeed={activeFeed}
        onSelectFeed={setActiveFeed}
        progress={progress}
        onOpenBookmarks={() => setShowBookmarksOnly(prev => !prev)}
        isBookmarkedFilterActive={showBookmarksOnly}
      />

      {/* Main Vertical Reels Feed */}
      {filteredCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Kart Bulunamadı</Text>
          <Text style={styles.emptySubtitle}>
            {showBookmarksOnly
              ? 'Henüz kaydedilmiş kartınız yok. Kartlardaki ayraç ikonuna basarak kaydedebilirsiniz.'
              : 'Bu kategoride henüz kart bulunmuyor. Yeni bir deste veya kart ekleyin!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CardItem
              card={item}
              height={feedItemHeight}
              width={windowDimensions.width}
              onReview={rating => handleReview(item.id, rating)}
              onToggleBookmark={() => handleToggleBookmark(item.id)}
              onOpenQuiz={() => item.quiz && setActiveQuiz(item.quiz)}
            />
          )}
          pagingEnabled
          snapToInterval={feedItemHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Mini Quiz Modal */}
      <QuizModal
        visible={!!activeQuiz}
        quiz={activeQuiz || undefined}
        onClose={() => setActiveQuiz(null)}
        onAnswerCorrect={handleQuizSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
