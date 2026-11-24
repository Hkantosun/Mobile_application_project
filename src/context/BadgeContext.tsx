import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';
import { evaluateBadges, EvaluatedBadge } from '../constants/badges';
import { useAppTheme } from './ThemeContext';

const CELEBRATED_BADGES_KEY = '@reellearn_celebrated_badges_v1';

interface BadgeContextValue {
  checkBadges: () => Promise<void>;
  resetCelebratedBadges: () => Promise<void>;
}

const BadgeContext = createContext<BadgeContextValue>({
  checkBadges: async () => {},
  resetCelebratedBadges: async () => {},
});

const PARTICLE_VECTORS = [
  { x: -78, y: -62, icon: 'sparkles' as const, size: 16 },
  { x: 76, y: -58, icon: 'star' as const, size: 15 },
  { x: -90, y: 12, icon: 'star' as const, size: 13 },
  { x: 88, y: 18, icon: 'sparkles' as const, size: 15 },
  { x: -55, y: 66, icon: 'sparkles' as const, size: 14 },
  { x: 58, y: 64, icon: 'star' as const, size: 14 },
];

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useAppTheme();
  const [queue, setQueue] = useState<EvaluatedBadge[]>([]);
  const activeBadge = queue[0] || null;

  const cardScale = useRef(new Animated.Value(0.75)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const medalScale = useRef(new Animated.Value(0.3)).current;
  const haloPulse = useRef(new Animated.Value(0.85)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activeBadge) return;

    cardScale.setValue(0.75);
    cardOpacity.setValue(0);
    medalScale.setValue(0.3);
    haloPulse.setValue(0.85);
    burstProgress.setValue(0);

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 95,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.spring(medalScale, {
          toValue: 1.08,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(medalScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(burstProgress, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, {
          toValue: 1.16,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloPulse, {
          toValue: 0.9,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [activeBadge, cardScale, cardOpacity, medalScale, haloPulse, burstProgress]);

  const checkBadges = useCallback(async () => {
    try {
      const [progress, cards, decks, rawCelebrated] = await Promise.all([
        StorageService.getProgress(),
        StorageService.getCards(),
        StorageService.getDecks(),
        AsyncStorage.getItem(CELEBRATED_BADGES_KEY),
      ]);

      const celebratedIds: string[] = rawCelebrated ? JSON.parse(rawCelebrated) : [];
      const evaluated = evaluateBadges(progress, cards, decks);
      const newlyUnlocked = evaluated.filter(
        b => b.unlocked && !celebratedIds.includes(b.id)
      );

      if (newlyUnlocked.length > 0) {
        const updatedCelebrated = [...celebratedIds, ...newlyUnlocked.map(b => b.id)];
        await AsyncStorage.setItem(CELEBRATED_BADGES_KEY, JSON.stringify(updatedCelebrated));
        setQueue(prev => [...prev, ...newlyUnlocked]);
      }
    } catch (error) {
      console.error('Badge check failed:', error);
    }
  }, []);

  const resetCelebratedBadges = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CELEBRATED_BADGES_KEY);
      setQueue([]);
    } catch (error) {
      console.error('Badge reset failed:', error);
    }
  }, []);

  const handleDismiss = () => {
    setQueue(prev => prev.slice(1));
  };

  return (
    <BadgeContext.Provider value={{ checkBadges, resetCelebratedBadges }}>
      {children}

      <Modal
        visible={!!activeBadge}
        transparent
        animationType="none"
        onRequestClose={handleDismiss}
      >
        <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
          {activeBadge && (
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primarySoftBorder,
                  opacity: cardOpacity,
                  transform: [{ scale: cardScale }],
                },
              ]}
            >
              <View style={[styles.kickerPill, { backgroundColor: colors.primaryPillBg }]}>
                <Ionicons name="sparkles" size={13} color={colors.primaryPillText} />
                <Text style={[styles.kickerText, { color: colors.primaryPillText }]}>
                  YENİ ROZET KAZANDIN!
                </Text>
              </View>

              {/* Animated Medal + Confetti Burst */}
              <View style={styles.medalStage}>
                {PARTICLE_VECTORS.map((p, idx) => {
                  const translateX = burstProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.x],
                  });
                  const translateY = burstProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.y],
                  });
                  const particleOpacity = burstProgress.interpolate({
                    inputRange: [0, 0.2, 0.75, 1],
                    outputRange: [0, 1, 0.9, 0],
                  });
                  const particleScale = burstProgress.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0.3, 1.15, 0.6],
                  });

                  return (
                    <Animated.View
                      key={idx}
                      style={[
                        styles.particle,
                        {
                          opacity: particleOpacity,
                          transform: [
                            { translateX },
                            { translateY },
                            { scale: particleScale },
                          ],
                        },
                      ]}
                    >
                      <Ionicons
                        name={p.icon}
                        size={p.size}
                        color={idx % 2 === 0 ? colors.goldIcon : colors.primary}
                      />
                    </Animated.View>
                  );
                })}

                <Animated.View
                  style={[
                    styles.haloRing,
                    {
                      backgroundColor: colors.primarySoftBg,
                      borderColor: colors.primarySoftBorder,
                      transform: [{ scale: haloPulse }],
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.medalCircle,
                    {
                      backgroundColor: colors.primary,
                      transform: [{ scale: medalScale }],
                    },
                  ]}
                >
                  <Ionicons name={activeBadge.icon} size={38} color={colors.onPrimary} />
                </Animated.View>
              </View>

              <Text style={[styles.badgeTitle, { color: colors.textPrimary }]}>
                {activeBadge.title}
              </Text>
              <Text style={[styles.badgeSub, { color: colors.primary }]}>
                {activeBadge.desc}
              </Text>
              <Text style={[styles.badgeMsg, { color: colors.textSecondary }]}>
                {activeBadge.celebrationMsg}
              </Text>

              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
                onPress={handleDismiss}
                activeOpacity={0.85}
              >
                <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                  Harika! Devam Et
                </Text>
                <Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Modal>
    </BadgeContext.Provider>
  );
};

export const useBadges = () => useContext(BadgeContext);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  medalStage: {
    width: 140,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  particle: {
    position: 'absolute',
  },
  haloRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
  },
  medalCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  badgeTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  badgeSub: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  badgeMsg: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  ctaBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
