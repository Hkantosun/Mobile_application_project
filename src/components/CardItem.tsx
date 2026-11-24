import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, DifficultyLevel, UserProgress } from '../types';
import { useAppTheme, AppColors } from '../context/ThemeContext';

interface CardItemProps {
  card: Card;
  height: number;
  width: number;
  currentIndex: number;
  totalCards: number;
  progress?: UserProgress;
  onReview: (rating: DifficultyLevel) => void;
  onToggleBookmark: () => void;
  onOpenQuiz?: () => void;
  onInlineQuizCorrect?: () => void;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  height,
  width,
  currentIndex,
  totalCards,
  onReview,
  onToggleBookmark,
  onInlineQuizCorrect,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<'hard' | 'easy' | null>(null);
  const [showDoubleTapBurst, setShowDoubleTapBurst] = useState(false);

  // Animations for decision buttons, feedback toast, and Instagram double-tap burst
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const repeatScale = useRef(new Animated.Value(1)).current;
  const easyScale = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);
  const hasReviewedRef = useRef<boolean>(false);

  const handleSelectOption = (idx: number) => {
    if (selectedOptionIndex !== null) return;
    setSelectedOptionIndex(idx);
    setIsAnswerRevealed(true);
    if (card.quiz && idx === card.quiz.correctAnswerIndex) {
      onInlineQuizCorrect?.();
    }
  };

  const triggerReviewAnimation = (rating: 'hard' | 'easy') => {
    if (hasReviewedRef.current) return;
    hasReviewedRef.current = true;
    const targetScale = rating === 'hard' ? repeatScale : easyScale;
    setReviewFeedback(rating);

    Animated.sequence([
      Animated.timing(targetScale, {
        toValue: 0.94,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.spring(targetScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.spring(feedbackAnim, {
        toValue: 1,
        friction: 6,
        tension: 85,
        useNativeDriver: true,
      }),
      Animated.delay(900),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setReviewFeedback(null);
    });

    onReview(rating);
  };

  const handleCardTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      lastTapRef.current = 0;
      if (isAnswerRevealed && (selectedOptionIndex !== null || !card.quiz) && !reviewFeedback) {
        setShowDoubleTapBurst(true);
        doubleTapAnim.setValue(0);
        Animated.sequence([
          Animated.spring(doubleTapAnim, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.delay(450),
          Animated.timing(doubleTapAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setShowDoubleTapBurst(false));

        triggerReviewAnimation('easy');
      }
    } else {
      lastTapRef.current = now;
    }
  };

  const handleCopyCode = () => {
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 1600);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📚 ReelLearn ile yeni bir bilgi öğrendim:\n\n❓ ${card.front}\n\n💡 ${card.back}\n\nReelLearn ile dikey akışta öğren!`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const difficultyLabel =
    card.difficulty === 'easy'
      ? 'Temel Kavram'
      : card.difficulty === 'hard'
      ? 'İleri Düzey'
      : 'Orta Düzey';

  return (
    <View style={[styles.container, { height, width }]}>
      {/* Focal White Micro-Learning Card (Stitch 5639db59) */}
      <View style={styles.studyCard}>
        {/* 1. Card Top Bar: Topic Badge, Progress Pill & Bookmark/Share */}
        <View style={styles.cardTopBar}>
          <View style={styles.topicGroup}>
            <View style={styles.topicPill}>
              <Text style={styles.topicPillText} numberOfLines={1}>
                {card.topic || (card.type === 'study' ? 'Ders Notu' : 'Genel Kültür')}
              </Text>
            </View>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaSubText} numberOfLines={1}>
              {difficultyLabel}
            </Text>
          </View>

          <View style={styles.topRightTools}>
            <View style={styles.counterPill}>
              <Text style={styles.counterText}>
                {currentIndex + 1} / {totalCards}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.iconCircleBtn,
                card.isBookmarked && styles.iconCircleBtnActive,
              ]}
              onPress={onToggleBookmark}
              activeOpacity={0.75}
            >
              <Ionicons
                name={card.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={card.isBookmarked ? colors.primaryPillText : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={handleShare}
              activeOpacity={0.75}
            >
              <Ionicons name="share-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Scrollable Conceptual Content + 4-Option Quiz + Takeaway */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollInner}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={handleCardTap} style={{ flexGrow: 1 }}>
            {/* Main Question Title */}
            <Text style={styles.questionTitle}>{card.front}</Text>

            {/* Optional Tactical Code Snippet Container (Dark Charcoal per Stitch) */}
            {card.codeSnippet && (
              <View style={styles.codeBlock}>
                <View style={styles.codeHeader}>
                  <Text style={styles.codeLang}>KOD ÖRNEĞİ</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={handleCopyCode}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isCodeCopied ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={isCodeCopied ? '#B5EFD5' : '#99D3B9'}
                    />
                    <Text style={styles.copyBtnText}>
                      {isCodeCopied ? 'Kopyalandı' : 'Kopyala'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeText}>{card.codeSnippet}</Text>
              </View>
            )}

            {/* 4-Option Multiple-Choice Stack (Answer stays locked until selected) */}
            {card.quiz ? (
              <View style={styles.optionsSection}>
                {card.quiz.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isAnswered = selectedOptionIndex !== null;
                  const isSelected = selectedOptionIndex === idx;
                  const isCorrectOpt = idx === card.quiz!.correctAnswerIndex;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.optionBtn,
                        isAnswered && isCorrectOpt && styles.optionBtnCorrect,
                        isAnswered && isSelected && !isCorrectOpt && styles.optionBtnWrong,
                      ]}
                      onPress={() => handleSelectOption(idx)}
                      disabled={isAnswered}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.optionBadge,
                          isAnswered && isCorrectOpt && styles.optionBadgeCorrect,
                          isAnswered && isSelected && !isCorrectOpt && styles.optionBadgeWrong,
                        ]}
                      >
                        {isAnswered && isCorrectOpt ? (
                          <Ionicons name="checkmark" size={13} color={colors.onPrimary} />
                        ) : isAnswered && isSelected ? (
                          <Ionicons name="close" size={13} color="#FFFFFF" />
                        ) : (
                          <Text style={[styles.optionBadgeText, { color: colors.textSecondary }]}>
                            {letter}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isAnswered && isCorrectOpt && styles.optionTextCorrect,
                          isAnswered && isSelected && !isCorrectOpt && styles.optionTextWrong,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {selectedOptionIndex === null && (
                  <View style={styles.lockedHintBar}>
                    <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.lockedHintText}>
                      İpucu ve açıklamayı görmek için bir şık işaretleyin
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Humanized Micro Delight Takeaway Box (Revealed after option selection) */}
            {isAnswerRevealed && (selectedOptionIndex !== null || !card.quiz) && (
              <View style={styles.takeawayBox}>
                <View style={styles.takeawayIconCircle}>
                  <Ionicons name="bulb-outline" size={15} color={colors.primary} />
                </View>
                <View style={styles.takeawayTexts}>
                  <Text style={styles.takeawayBody}>
                    <Text style={styles.takeawayBold}>İpucu & Cevap: </Text>
                    {card.back}
                  </Text>
                  {card.quiz?.explanation && (
                    <Text style={styles.takeawayExplanation}>
                      {card.quiz.explanation}
                    </Text>
                  )}
                  <Text style={styles.doubleTapHint}>
                    ✨ Çift dokunarak "Öğrendim" diyebilirsin
                  </Text>
                </View>
              </View>
            )}
          </Pressable>
        </ScrollView>

        {/* Active Review Feedback Banner */}
        {reviewFeedback && (
          <Animated.View
            style={[
              styles.feedbackBanner,
              reviewFeedback === 'easy'
                ? styles.feedbackBannerEasy
                : styles.feedbackBannerHard,
              {
                opacity: feedbackAnim,
                transform: [
                  {
                    scale: feedbackAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={reviewFeedback === 'easy' ? 'checkmark-circle' : 'refresh-circle'}
              size={17}
              color={reviewFeedback === 'easy' ? colors.primaryPillText : colors.goldText}
            />
            <Text
              style={[
                styles.feedbackBannerText,
                { color: reviewFeedback === 'easy' ? colors.primaryPillText : colors.goldText },
              ]}
            >
              {reviewFeedback === 'easy'
                ? 'Kart tamamlandı! Aralıklı tekrara eklendi ✨ (+15 XP)'
                : 'Kısa süre sonra tekrar karşına çıkacak 🔁 (+5 XP)'}
            </Text>
          </Animated.View>
        )}

        {/* 3. Action Buttons (Tekrar Et / Öğrendim) */}
        <View style={styles.actionsRow}>
          <Animated.View style={{ flex: 1, transform: [{ scale: repeatScale }] }}>
            <TouchableOpacity
              style={styles.repeatBtn}
              onPress={() => triggerReviewAnimation('hard')}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color={colors.textMuted} />
              <Text style={styles.repeatBtnText}>Tekrar Et</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ flex: 1, transform: [{ scale: easyScale }] }}>
            <TouchableOpacity
              style={styles.learnedBtn}
              onPress={() => triggerReviewAnimation('easy')}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done" size={18} color={colors.onPrimary} />
              <Text style={styles.learnedBtnText}>Öğrendim</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Instagram-Style Double-Tap Burst Overlay ("Öğrendim!") */}
        {showDoubleTapBurst && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.doubleTapOverlay,
              {
                opacity: doubleTapAnim,
                transform: [
                  {
                    scale: doubleTapAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.45, 1.08],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.doubleTapCircle}>
              <Ionicons name="checkmark-done" size={48} color={colors.onPrimary} />
            </View>
            <Text style={styles.doubleTapLabel}>Öğrendim!</Text>
          </Animated.View>
        )}
      </View>

      {/* 4. Subtle Tactile Swipe Affordance */}
      <View style={styles.swipeAffordance}>
        <Ionicons
          name={currentIndex + 1 >= totalCards ? 'trophy-outline' : 'chevron-up'}
          size={15}
          color={currentIndex + 1 >= totalCards ? colors.primary : colors.textMuted}
        />
        <Text style={styles.swipeAffordanceText}>
          {currentIndex + 1 >= totalCards
            ? 'Bu destedeki son soruya ulaştın 🎉'
            : 'Sonraki kart için yukarı kaydır'}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  studyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 10,
  },
  topicGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  topicPill: {
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '65%',
  },
  topicPillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: 11,
  },
  metaSubText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  topRightTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterPill: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  counterText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  iconCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleBtnActive: {
    backgroundColor: colors.primaryPillBg,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  questionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  codeBlock: {
    backgroundColor: colors.codeBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codeLang: {
    color: '#C0C9C2',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    color: '#99D3B9',
    fontSize: 11,
    fontWeight: '600',
  },
  codeText: {
    color: colors.codeText,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'monospace',
  },
  optionsSection: {
    gap: 7,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 10,
  },
  optionBtnCorrect: {
    backgroundColor: colors.primarySoftBg,
    borderColor: colors.primary,
  },
  optionBtnWrong: {
    backgroundColor: colors.errorSoftBg,
    borderColor: colors.error,
  },
  optionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeCorrect: {
    backgroundColor: colors.primary,
  },
  optionBadgeWrong: {
    backgroundColor: colors.error,
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
  optionTextCorrect: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionTextWrong: {
    color: colors.errorSoftText,
    fontWeight: '600',
  },
  lockedHintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    backgroundColor: colors.surfaceLow,
    borderRadius: 10,
    marginTop: 2,
  },
  lockedHintText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  takeawayBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceLow,
    borderRadius: 12,
    padding: 11,
    gap: 9,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  takeawayIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  takeawayTexts: {
    flex: 1,
  },
  takeawayBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  takeawayBold: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  takeawayExplanation: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  doubleTapHint: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  feedbackBannerEasy: {
    backgroundColor: colors.primaryPillBg,
  },
  feedbackBannerHard: {
    backgroundColor: colors.goldBg,
  },
  feedbackBannerText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  repeatBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  repeatBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  learnedBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 2,
  },
  learnedBtnText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  doubleTapOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  doubleTapCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  doubleTapLabel: {
    color: colors.primaryPillText,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
    backgroundColor: colors.primaryPillBg,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },
  swipeAffordance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    paddingBottom: 2,
  },
  swipeAffordanceText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
