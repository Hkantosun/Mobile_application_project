import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';
import { UserProgress } from '../types';
import { THEME } from '../constants/theme';
import { INITIAL_USER_PROGRESS } from '../constants/initialData';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [progress, setProgress] = useState<UserProgress>(INITIAL_USER_PROGRESS);

  const loadProgress = useCallback(async () => {
    const loaded = await StorageService.getProgress();
    setProgress(loaded);
  }, []);

  useEffect(() => {
    loadProgress();
    const unsubscribe = navigation.addListener('focus', loadProgress);
    return unsubscribe;
  }, [navigation, loadProgress]);

  const handleResetData = () => {
    Alert.alert(
      'Verileri Sıfırla',
      'Tüm kart ilerlemeleri ve istatistikler varsayılan başlangıç durumuna döndürülecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await StorageService.resetAll();
            loadProgress();
            Alert.alert('Tamamlandı', 'Uygulama demo verileri sıfırlandı.');
          },
        },
      ]
    );
  };

  // XP progress calculation (each level is 100 XP)
  const currentLevel = progress.level || Math.floor(progress.xp / 100) + 1;
  const currentLevelXP = progress.xp % 100;
  const progressPercent = Math.min(100, Math.max(0, currentLevelXP));

  // Daily goal progress
  const dailyGoalPercent = Math.min(
    100,
    Math.round((progress.todayCompletedCount / (progress.dailyGoal || 15)) * 100)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Öğrenme Profilim</Text>
        <Text style={styles.headerSubtitle}>Alışkanlıkların ve öğrenme verilerin</Text>

        {/* Big Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakIconCircle}>
            <Ionicons name="flame" size={32} color={THEME.colors.accentOrange} />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{progress.streak} Günlük Seri</Text>
            <Text style={styles.streakSubtext}>
              {progress.streak > 0
                ? 'Harika gidiyorsun! Beyin haritan aktif şekilde güçleniyor.'
                : 'Bugün henüz çalışmadın. 5 dakikanı ayırarak seriyi başlat!'}
            </Text>
          </View>
        </View>

        {/* Level & XP Box */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Ionicons name="shield-checkmark" size={16} color={THEME.colors.primary} />
              <Text style={styles.levelBadgeText}>Seviye {currentLevel}</Text>
            </View>
            <Text style={styles.xpText}>{progress.xp} Toplam XP</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.nextLevelText}>
            Sonraki seviyeye {100 - currentLevelXP} XP kaldı
          </Text>
        </View>

        {/* Daily Goal Card */}
        <View style={styles.goalCard}>
          <View style={styles.goalRow}>
            <View>
              <Text style={styles.goalTitle}>Günlük Çalışma Hedefi</Text>
              <Text style={styles.goalSubtitle}>
                {progress.todayCompletedCount} / {progress.dailyGoal} kart tamamlandı
              </Text>
            </View>
            <Text style={styles.goalPercentage}>{dailyGoalPercent}%</Text>
          </View>

          <View style={styles.goalBarBackground}>
            <View style={[styles.goalBarFill, { width: `${dailyGoalPercent}%` }]} />
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Tüm Zamanların İstatistikleri</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="documents-outline" size={24} color="#38BDF8" />
            <Text style={styles.statNumber}>{progress.totalCardsReviewed}</Text>
            <Text style={styles.statLabel}>Çözülen Kartlar</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="bulb-outline" size={24} color="#FBBF24" />
            <Text style={styles.statNumber}>{Math.round(progress.totalCardsReviewed * 0.7)}</Text>
            <Text style={styles.statLabel}>Kalıcı Öğrenilen</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="calendar-outline" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{progress.lastStudiedDate || 'Bugün'}</Text>
            <Text style={styles.statLabel}>Son Çalışma</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="sparkles-outline" size={24} color="#EC4899" />
            <Text style={styles.statNumber}>%85</Text>
            <Text style={styles.statLabel}>Başarı Oranı</Text>
          </View>
        </View>

        {/* Cognitive Science Note */}
        <View style={styles.scienceCard}>
          <Ionicons name="school-outline" size={20} color={THEME.colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.scienceTitle}>Aralıklı Tekrar Nasıl Çalışır?</Text>
            <Text style={styles.scienceText}>
              Ebbinghaus Unutma Eğrisine göre bir bilgi kartını tam unutma eşiğindeyken tekrar
              görmek bilginin uzun süreli belleğe transferini sağlar.
            </Text>
          </View>
        </View>

        {/* Reset Demo Data Button */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetData} activeOpacity={0.8}>
          <Ionicons name="reload-circle-outline" size={18} color="#94A3B8" />
          <Text style={styles.resetBtnText}>Demo Verilerini Sıfırla</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 16,
    marginTop: 2,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1712',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#7C2D1266',
    marginBottom: 14,
  },
  streakIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EA580C26',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF8A00',
  },
  streakSubtext: {
    fontSize: 12,
    color: '#FED7AA',
    marginTop: 2,
    lineHeight: 16,
  },
  levelCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 14,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F126',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    gap: 6,
  },
  levelBadgeText: {
    color: '#A5B4FC',
    fontWeight: '700',
    fontSize: 13,
  },
  xpText: {
    color: THEME.colors.accentYellow,
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#1E2538',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 4,
  },
  nextLevelText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },
  goalCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 20,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  goalSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  goalPercentage: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.success,
  },
  goalBarBackground: {
    height: 8,
    backgroundColor: '#1E2538',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.success,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  scienceCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1E2E',
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2B3552',
    alignItems: 'center',
    marginBottom: 20,
  },
  scienceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A5B4FC',
    marginBottom: 2,
  },
  scienceText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#161926',
    borderWidth: 1,
    borderColor: '#252D42',
    gap: 6,
  },
  resetBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
