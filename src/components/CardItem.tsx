import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, DifficultyLevel } from '../types';
import { THEME } from '../constants/theme';

interface CardItemProps {
  card: Card;
  height: number;
  width: number;
  onReview: (rating: DifficultyLevel) => void;
  onToggleBookmark: () => void;
  onOpenQuiz?: () => void;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  height,
  width,
  onReview,
  onToggleBookmark,
  onOpenQuiz,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setIsFlipped(false);
    } else {
      Animated.spring(animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setIsFlipped(true);
    }
  };

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, { height, width }]}>
      {/* Background Glow Effect */}
      <View style={styles.glowCircle} />

      {/* Main Card Container */}
      <TouchableOpacity
        activeOpacity={0.96}
        onPress={flipCard}
        style={styles.cardTouchable}
      >
        {/* FRONT SIDE */}
        <Animated.View
          style={[
            styles.cardFace,
            {
              transform: [{ rotateY: frontInterpolate }],
              opacity: frontOpacity,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={styles.cardHeader}>
            <View style={styles.topicBadge}>
              <Ionicons
                name={card.type === 'study' ? 'school-outline' : 'sparkles-outline'}
                size={14}
                color={card.type === 'study' ? THEME.colors.primary : THEME.colors.secondary}
              />
              <Text style={styles.topicText}>
                {card.topic || (card.type === 'study' ? 'Ders Notu' : 'Genel Kültür')}
              </Text>
            </View>

            <View style={styles.intervalBadge}>
              <Ionicons name="time-outline" size={12} color={THEME.colors.textMuted} />
              <Text style={styles.intervalText}>{card.intervalDays}g aralık</Text>
            </View>
          </View>

          {/* Question / Concept Prompt */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.questionText}>{card.front}</Text>

            {/* Optional Code Snippet */}
            {card.codeSnippet && (
              <View style={styles.codeContainer}>
                <View style={styles.codeHeader}>
                  <View style={styles.codeDot} />
                  <View style={[styles.codeDot, { backgroundColor: '#F59E0B' }]} />
                  <View style={[styles.codeDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.codeLanguage}>code</Text>
                </View>
                <Text style={styles.codeText}>{card.codeSnippet}</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Flip Indicator */}
          <View style={styles.flipPrompt}>
            <Ionicons name="refresh-outline" size={16} color={THEME.colors.primary} />
            <Text style={styles.flipPromptText}>Cevabı görmek için dokunun</Text>
          </View>
        </Animated.View>

        {/* BACK SIDE */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardFaceBack,
            {
              transform: [{ rotateY: backInterpolate }],
              opacity: backOpacity,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.topicBadge, { backgroundColor: '#10B98122', borderColor: '#10B98144' }]}>
              <Ionicons name="bulb-outline" size={14} color={THEME.colors.success} />
              <Text style={[styles.topicText, { color: THEME.colors.success }]}>Açıklama & Çözüm</Text>
            </View>

            <TouchableOpacity onPress={flipCard} style={styles.flipBackIcon}>
              <Ionicons name="sync" size={16} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.answerText}>{card.back}</Text>
          </ScrollView>

          {/* In-feed Mini Quiz Trigger (If Available) */}
          {card.quiz && (
            <TouchableOpacity
              style={styles.quizButton}
              onPress={onOpenQuiz}
              activeOpacity={0.8}
            >
              <Ionicons name="help-circle" size={18} color="#FFFFFF" />
              <Text style={styles.quizButtonText}>Mini Testi Çöz (+25 XP)</Text>
            </TouchableOpacity>
          )}

          {/* Action Ratings (Spaced Repetition Feedback) */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.ratingBtn, styles.ratingHard]}
              onPress={() => onReview('hard')}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color={THEME.colors.danger} />
              <Text style={styles.ratingBtnText}>Tekrar</Text>
              <Text style={styles.ratingSubText}>1 gün</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingBtn, styles.ratingMedium]}
              onPress={() => onReview('medium')}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={THEME.colors.warning} />
              <Text style={styles.ratingBtnText}>Orta</Text>
              <Text style={styles.ratingSubText}>+10 XP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingBtn, styles.ratingEasy]}
              onPress={() => onReview('easy')}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={THEME.colors.success} />
              <Text style={styles.ratingBtnText}>Anladım</Text>
              <Text style={styles.ratingSubText}>+15 XP</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* TikTok-Style Right Action Sidebar */}
      <View style={styles.rightSidebar}>
        {/* Bookmark Action */}
        <TouchableOpacity
          style={styles.sidebarButton}
          onPress={onToggleBookmark}
          activeOpacity={0.7}
        >
          <View style={[styles.sidebarIconCircle, card.isBookmarked && styles.sidebarIconActive]}>
            <Ionicons
              name={card.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={card.isBookmarked ? THEME.colors.accentYellow : THEME.colors.textPrimary}
            />
          </View>
          <Text style={styles.sidebarText}>
            {card.isBookmarked ? 'Kayıtlı' : 'Kaydet'}
          </Text>
        </TouchableOpacity>

        {/* Quiz Direct Button (If Quiz Exists) */}
        {card.quiz && (
          <TouchableOpacity
            style={styles.sidebarButton}
            onPress={onOpenQuiz}
            activeOpacity={0.7}
          >
            <View style={[styles.sidebarIconCircle, { backgroundColor: '#6366F133', borderColor: '#6366F1' }]}>
              <Ionicons name="extension-puzzle-outline" size={20} color={THEME.colors.primary} />
            </View>
            <Text style={styles.sidebarText}>Test</Text>
          </TouchableOpacity>
        )}

        {/* Flip Quick Button */}
        <TouchableOpacity
          style={styles.sidebarButton}
          onPress={flipCard}
          activeOpacity={0.7}
        >
          <View style={styles.sidebarIconCircle}>
            <Ionicons name="swap-horizontal" size={20} color={THEME.colors.textPrimary} />
          </View>
          <Text style={styles.sidebarText}>{isFlipped ? 'Soru' : 'Cevap'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: 20,
  },
  glowCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#4F46E518',
    top: '25%',
  },
  cardTouchable: {
    width: '84%',
    height: '86%',
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardFaceBack: {
    backgroundColor: '#161B2E',
    borderColor: '#2A3352',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F11E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: '#6366F133',
  },
  topicText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  intervalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intervalText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  flipBackIcon: {
    padding: 6,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 28,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '400',
    color: THEME.colors.textLight,
    lineHeight: 26,
  },
  codeContainer: {
    backgroundColor: '#090B10',
    borderRadius: THEME.borderRadius.sm,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  codeLanguage: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginLeft: 'auto',
    textTransform: 'uppercase',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#38BDF8',
    fontSize: 13,
    lineHeight: 18,
  },
  flipPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#1E233866',
    borderRadius: THEME.borderRadius.md,
    marginTop: 10,
  },
  flipPromptText: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    marginVertical: 10,
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    gap: 8,
  },
  ratingBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#1C2237',
    borderWidth: 1,
  },
  ratingHard: {
    borderColor: '#EF444444',
    backgroundColor: '#EF444414',
  },
  ratingMedium: {
    borderColor: '#F59E0B44',
    backgroundColor: '#F59E0B14',
  },
  ratingEasy: {
    borderColor: '#10B98144',
    backgroundColor: '#10B98114',
  },
  ratingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  ratingSubText: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  rightSidebar: {
    position: 'absolute',
    right: 14,
    bottom: '20%',
    alignItems: 'center',
    gap: 16,
  },
  sidebarButton: {
    alignItems: 'center',
  },
  sidebarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C2237E6',
    borderWidth: 1,
    borderColor: '#2F3854',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarIconActive: {
    borderColor: THEME.colors.accentYellow,
    backgroundColor: '#2D2833E6',
  },
  sidebarText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
