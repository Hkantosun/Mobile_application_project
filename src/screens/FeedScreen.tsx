import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CardItem } from '../components/CardItem';
import { FeedHeaderTabs } from '../components/FeedHeaderTabs';
import { QuizModal } from '../components/QuizModal';
import { StorageService } from '../services/storageService';
import { Card, Deck, DifficultyLevel, FeedType, QuizQuestion, UserProgress } from '../types';
import { THEME } from '../constants/theme';
import { INITIAL_USER_PROGRESS } from '../constants/initialData';
import { useAppTheme, AppColors } from '../context/ThemeContext';
import { useBadges } from '../context/BadgeContext';

export const FeedScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation }) => {
  const { colors } = useAppTheme();
  const { checkBadges } = useBadges();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeFeed, setActiveFeed] = useState<FeedType>('study');
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(route?.params?.deckId || null);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [progress, setProgress] = useState<UserProgress>(INITIAL_USER_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Exact dynamic height of the feed area measured via onLayout
  const [feedAreaHeight, setFeedAreaHeight] = useState<number>(0);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const flatListRef = useRef<FlatList<Card>>(null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: any; screen: any }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await StorageService.initialize();
      const [loadedCards, loadedDecks, loadedProgress] = await Promise.all([
        StorageService.getCards(),
        StorageService.getDecks(),
        StorageService.getProgress(),
      ]);
      setCards(loadedCards);
      setDecks(loadedDecks);
      setProgress(loadedProgress);
    } catch (error) {
      console.error('Failed to load feed data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (route?.params?.deckId !== undefined) {
      setSelectedDeckId(route.params.deckId);
      setActiveFeed('study');
      setShowBookmarksOnly(false);
    }
  }, [route?.params?.deckId]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation?.addListener?.('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  // Current active deck title
  const currentDeck = useMemo(() => {
    if (!selectedDeckId) return null;
    return decks.find(d => d.id === selectedDeckId);
  }, [decks, selectedDeckId]);

  const deckHeaderTitle = useMemo(() => {
    if (showBookmarksOnly) return 'Kayıtlı Kartlar';
    if (currentDeck) return currentDeck.title;
    return activeFeed === 'study' ? 'Tüm Dersler' : 'Genel Kültür';
  }, [currentDeck, showBookmarksOnly, activeFeed]);

  // Feed items filtering based on dual tabs and active deck
  const filteredCards = useMemo(() => {
    let result = cards.filter(c => c.type === activeFeed);

    if (selectedDeckId) {
      result = result.filter(c => c.deckId === selectedDeckId);
    }

    if (showBookmarksOnly) {
      result = result.filter(c => c.isBookmarked);
    }

    return result;
  }, [cards, activeFeed, selectedDeckId, showBookmarksOnly]);

  const handleReview = async (cardId: string, rating: DifficultyLevel, currentIndex: number) => {
    try {
      const { updatedCard, newProgress } = await StorageService.reviewCard(cardId, rating);
      setCards(prev => prev.map(c => (c.id === cardId ? updatedCard : c)));
      setProgress(newProgress);
      checkBadges();

      // Show animated feedback toast first, then smoothly advance to next card
      if (currentIndex + 1 < filteredCards.length) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: currentIndex + 1,
            animated: true,
          });
        }, 750);
      }
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
      checkBadges();
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
    }
  };

  const handleQuizSuccess = async () => {
    try {
      const updated = await StorageService.addXP(25);
      setProgress(updated);
      checkBadges();
    } catch (error) {
      console.error('Quiz XP update failed:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>ReelLearn Akışı Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER WITH TIKTOK-STYLE TABS & DECK SELECTOR */}
      <FeedHeaderTabs
        activeFeed={activeFeed}
        onSelectFeed={feed => {
          setActiveFeed(feed);
          setSelectedDeckId(null);
        }}
        progress={progress}
        currentDeckTitle={deckHeaderTitle}
        onOpenDeckSelector={() => setIsDeckModalOpen(true)}
        onOpenBookmarks={() => setShowBookmarksOnly(prev => !prev)}
        onOpenProfile={() => navigation?.navigate?.('Profil')}
        isBookmarkedFilterActive={showBookmarksOnly}
      />

      {/* 2. REEL CONTAINER WITH EXACT HEIGHT MEASUREMENT */}
      <View
        style={styles.feedWrapper}
        onLayout={e => {
          const { height } = e.nativeEvent.layout;
          if (height > 0 && Math.abs(height - feedAreaHeight) > 1) {
            setFeedAreaHeight(height);
          }
        }}
      >
        {filteredCards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="sparkles" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Kart Bulunamadı</Text>
            <Text style={styles.emptySubtitle}>
              {showBookmarksOnly
                ? 'Henüz kaydedilmiş kartınız bulunmuyor. Kartların yanındaki kaydet ikonuna dokunarak buraya ekleyebilirsiniz.'
                : 'Bu kategoride kart bulunmuyor. Deste seçebilir veya yeni kartlar ekleyebilirsiniz!'}
            </Text>
            {selectedDeckId && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => setSelectedDeckId(null)}
              >
                <Text style={styles.resetFilterBtnText}>Tüm Kartları Göster</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : feedAreaHeight > 0 ? (
          <FlatList
            ref={flatListRef}
            data={filteredCards}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <CardItem
                card={item}
                height={feedAreaHeight}
                width={screenWidth}
                currentIndex={index}
                totalCards={filteredCards.length}
                progress={progress}
                onReview={rating => handleReview(item.id, rating, index)}
                onToggleBookmark={() => handleToggleBookmark(item.id)}
                onOpenQuiz={() => item.quiz && setActiveQuiz(item.quiz)}
                onInlineQuizCorrect={handleQuizSuccess}
              />
            )}
            pagingEnabled
            snapToInterval={feedAreaHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: feedAreaHeight,
              offset: feedAreaHeight * index,
              index,
            })}
          />
        ) : null}
      </View>

      {/* 3. QUICK DECK SELECTOR MODAL */}
      <Modal
        visible={isDeckModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeckModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDeckModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Çalışılacak Desteyi Seç</Text>
              <TouchableOpacity onPress={() => setIsDeckModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* All cards option */}
            <TouchableOpacity
              style={[
                styles.deckOptionItem,
                selectedDeckId === null && styles.deckOptionActive,
              ]}
              onPress={() => {
                setSelectedDeckId(null);
                setIsDeckModalOpen(false);
              }}
            >
              <View style={styles.deckOptionLeft}>
                <Ionicons name="apps" size={18} color={colors.primary} />
                <Text style={styles.deckOptionText}>
                  {activeFeed === 'study' ? 'Tüm Ders Kartları' : 'Tüm Genel Kültür'}
                </Text>
              </View>
              {selectedDeckId === null && (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Decks list */}
            {decks
              .filter(d => (activeFeed === 'study' ? !d.isGeneralKnowledge : d.isGeneralKnowledge))
              .map(deck => (
                <TouchableOpacity
                  key={deck.id}
                  style={[
                    styles.deckOptionItem,
                    selectedDeckId === deck.id && styles.deckOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedDeckId(deck.id);
                    setIsDeckModalOpen(false);
                  }}
                >
                  <View style={styles.deckOptionLeft}>
                    <Ionicons
                      name={(deck.iconName as any) || 'book'}
                      size={18}
                      color={deck.color || THEME.colors.primary}
                    />
                    <Text style={styles.deckOptionText}>{deck.title}</Text>
                  </View>
                  <Text style={styles.deckCardCountText}>{deck.cardCount} kart</Text>
                </TouchableOpacity>
              ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 4. ACTIVE RECALL MINI QUIZ MODAL */}
      <QuizModal
        visible={!!activeQuiz}
        quiz={activeQuiz || undefined}
        onClose={() => setActiveQuiz(null)}
        onAnswerCorrect={handleQuizSuccess}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  feedWrapper: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: THEME.borderRadius.full,
  },
  resetFilterBtnText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  deckOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: 4,
    backgroundColor: colors.background,
  },
  deckOptionActive: {
    backgroundColor: colors.primarySoftBg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  deckOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  deckOptionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  deckCardCountText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
