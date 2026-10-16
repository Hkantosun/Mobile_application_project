import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedType, UserProgress } from '../types';
import { THEME } from '../constants/theme';

interface FeedHeaderTabsProps {
  activeFeed: FeedType;
  onSelectFeed: (feed: FeedType) => void;
  progress: UserProgress;
  onOpenBookmarks?: () => void;
  isBookmarkedFilterActive?: boolean;
}

export const FeedHeaderTabs: React.FC<FeedHeaderTabsProps> = ({
  activeFeed,
  onSelectFeed,
  progress,
  onOpenBookmarks,
  isBookmarkedFilterActive = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Left: Streak & XP Counter */}
      <View style={styles.streakBadge}>
        <Ionicons name="flame" size={18} color={THEME.colors.accentOrange} />
        <Text style={styles.streakText}>{progress.streak}g</Text>
        <View style={styles.xpDivider} />
        <Text style={styles.xpText}>{progress.xp} XP</Text>
      </View>

      {/* Center: TikTok-Style Dual Switcher */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectFeed('study')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeFeed === 'study' && styles.tabTextActive,
            ]}
          >
            Derslerim
          </Text>
          {activeFeed === 'study' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <View style={styles.tabSeparator} />

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectFeed('general_knowledge')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeFeed === 'general_knowledge' && styles.tabTextActive,
            ]}
          >
            Genel Kültür
          </Text>
          {activeFeed === 'general_knowledge' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Right: Saved / Bookmark Filter Toggle */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          isBookmarkedFilterActive && styles.actionButtonActive,
        ]}
        onPress={onOpenBookmarks}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isBookmarkedFilterActive ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={isBookmarkedFilterActive ? THEME.colors.accentYellow : THEME.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2338CC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: '#303956',
  },
  streakText: {
    color: '#FFA500',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  xpDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#475569',
    marginHorizontal: 6,
  },
  xpText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  activeIndicator: {
    width: 20,
    height: 3,
    backgroundColor: THEME.colors.textPrimary,
    borderRadius: 2,
    marginTop: 4,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E2338CC',
    borderWidth: 1,
    borderColor: '#303956',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#2E274FCC',
    borderColor: THEME.colors.accentYellow,
  },
});
