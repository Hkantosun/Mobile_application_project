import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedType, UserProgress } from '../types';
import { useAppTheme, AppColors } from '../context/ThemeContext';

interface FeedHeaderTabsProps {
  activeFeed: FeedType;
  onSelectFeed: (feed: FeedType) => void;
  progress: UserProgress;
  currentDeckTitle?: string;
  onOpenDeckSelector?: () => void;
  onOpenBookmarks?: () => void;
  onOpenProfile?: () => void;
  isBookmarkedFilterActive?: boolean;
}

export const FeedHeaderTabs: React.FC<FeedHeaderTabsProps> = ({
  activeFeed,
  onSelectFeed,
  progress,
  currentDeckTitle = 'Tüm Dersler',
  onOpenDeckSelector,
  onOpenBookmarks,
  onOpenProfile,
  isBookmarkedFilterActive = false,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const firstName = (progress.displayName || 'Hakan').trim().split(' ')[0];
  const todayCount = progress.todayCompletedCount || 0;
  const dailyGoal = progress.dailyGoal || 15;
  const goalPct = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  return (
    <View style={styles.wrapper}>
      {/* 1. Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <View style={styles.logoMark}>
            <Ionicons name="leaf" size={15} color={colors.onPrimary} />
          </View>
          <Text style={styles.brandName}>ReelLearn</Text>
          <Text style={styles.brandSub}>• Akış</Text>
        </View>

        <View style={styles.topBarRight}>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={15} color={colors.goldIcon} />
            <Text style={styles.streakText}>{progress.streak || 0} Gün</Text>
          </View>

          <TouchableOpacity
            style={styles.profileIconBtn}
            onPress={onOpenProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Greeting + Compact Daily Goal Strip */}
      <View style={styles.contextArea}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingTitle} numberOfLines={1}>
              Merhaba, {firstName} 👋
            </Text>
            <Text style={styles.greetingSub}>Bugün biraz öğrenelim.</Text>
          </View>

          {/* Compact Deck & Bookmark Pills */}
          <View style={styles.controlsRight}>
            <TouchableOpacity
              style={styles.deckSelectorChip}
              onPress={onOpenDeckSelector}
              activeOpacity={0.8}
            >
              <Text style={styles.deckSelectorText} numberOfLines={1}>
                {currentDeckTitle}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bookmarkChip,
                isBookmarkedFilterActive && styles.bookmarkChipActive,
              ]}
              onPress={onOpenBookmarks}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isBookmarkedFilterActive ? 'bookmark' : 'bookmark-outline'}
                size={14}
                color={isBookmarkedFilterActive ? colors.onPrimary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Goal Micro Card */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeaderRow}>
            <View style={styles.goalTitleLeft}>
              <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
              <Text style={styles.goalTitle}>Günün Hedefi</Text>
            </View>
            <Text style={styles.goalCount}>
              {todayCount} / {dailyGoal} kart
            </Text>
          </View>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${goalPct}%` }]} />
          </View>
        </View>

        {/* Segmented Dual Feed Switcher */}
        <View style={styles.feedSwitchTrack}>
          <TouchableOpacity
            style={[
              styles.feedSwitchBtn,
              activeFeed === 'study' && styles.feedSwitchBtnActive,
            ]}
            onPress={() => onSelectFeed('study')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.feedSwitchText,
                activeFeed === 'study' && styles.feedSwitchTextActive,
              ]}
            >
              Derslerim
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedSwitchBtn,
              activeFeed === 'general_knowledge' && styles.feedSwitchBtnActive,
            ]}
            onPress={() => onSelectFeed('general_knowledge')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.feedSwitchText,
                activeFeed === 'general_knowledge' && styles.feedSwitchTextActive,
              ]}
            >
              Genel Kültür
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
  },
  topBar: {
    height: 50,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  brandSub: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  streakText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  profileIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  greetingSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deckSelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
    maxWidth: 128,
  },
  deckSelectorText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  bookmarkChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkChipActive: {
    backgroundColor: colors.primary,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  goalCount: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  goalTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  feedSwitchTrack: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  feedSwitchBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedSwitchBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  feedSwitchText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  feedSwitchTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
