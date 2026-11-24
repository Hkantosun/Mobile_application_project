import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';
import { Card, Deck, UserProgress } from '../types';
import { INITIAL_USER_PROGRESS } from '../constants/initialData';
import { useAppTheme, AppColors } from '../context/ThemeContext';
import { evaluateBadges } from '../constants/badges';
import { useBadges } from '../context/BadgeContext';

function getInitials(name?: string): string {
  const parts = (name || 'HT').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors, toggleTheme } = useAppTheme();
  const { checkBadges, resetCelebratedBadges } = useBadges();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [progress, setProgress] = useState<UserProgress>(INITIAL_USER_PROGRESS);
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Edit Profile Modal state (no photo picker)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDailyGoal, setEditDailyGoal] = useState('');

  const loadData = useCallback(async () => {
    const [loadedProgress, loadedCards, loadedDecks] = await Promise.all([
      StorageService.getProgress(),
      StorageService.getCards(),
      StorageService.getDecks(),
    ]);
    setProgress(loadedProgress);
    setCards(loadedCards);
    setDecks(loadedDecks);
    checkBadges();
  }, [checkBadges]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const openEditModal = () => {
    setEditName(progress.displayName || 'Hakan Tosun');
    setEditUsername(progress.username || '@hkan.dev');
    setEditBio(progress.bio || 'Bilişsel Kaşif');
    setEditDailyGoal(String(progress.dailyGoal || 15));
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    const parsedGoal = parseInt(editDailyGoal, 10);
    const validGoal =
      !isNaN(parsedGoal) && parsedGoal > 0 ? Math.min(200, parsedGoal) : progress.dailyGoal;

    const updated: UserProgress = {
      ...progress,
      displayName: editName.trim() || 'Öğrenci',
      username: editUsername.trim() || '@kullanici',
      bio: editBio.trim() || 'Mikro-Öğrenme Kaşifi',
      dailyGoal: validGoal,
    };

    await StorageService.saveProgress(updated);
    setProgress(updated);
    setIsEditModalOpen(false);
    checkBadges();
  };

  const handleResetData = () => {
    Alert.alert(
      'Verileri Sıfırla',
      'Tüm kart ilerlemeleri, rozetler, seviye ve istatistikler varsayılan duruma döndürülecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await StorageService.resetAll();
            await resetCelebratedBadges();
            loadData();
            Alert.alert('Tamamlandı', 'Uygulama verileri sıfırlandı.');
          },
        },
      ]
    );
  };

  // Real calculated metrics
  const currentLevel = progress.level || Math.floor((progress.xp || 0) / 100) + 1;
  const streakDays = progress.streak || 0;
  const totalXp = progress.xp || 0;
  const completedToday = progress.todayCompletedCount || 0;
  const goalToday = progress.dailyGoal || 15;
  const dailyPercent = Math.min(100, Math.round((completedToday / goalToday) * 100));
  const bookmarkedCount = useMemo(() => cards.filter(c => c.isBookmarked).length, [cards]);

  const badges = useMemo(
    () => evaluateBadges(progress, cards, decks),
    [progress, cards, decks]
  );
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <View style={styles.logoMark}>
            <Ionicons name="leaf" size={15} color={colors.onPrimary} />
          </View>
          <Text style={styles.brandName}>ReelLearn</Text>
          <Text style={styles.brandSub}>• Profil</Text>
        </View>

        <View style={styles.topBarRight}>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={15} color={colors.goldIcon} />
            <Text style={styles.streakText}>{streakDays} Gün</Text>
          </View>

          <TouchableOpacity
            style={styles.editTopBtn}
            onPress={openEditModal}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Centered Profile Hero Section (Monogram — No Photo) */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.heroMonogramRing}
            onPress={openEditModal}
            activeOpacity={0.85}
          >
            <View style={styles.heroMonogramInner}>
              <Text style={styles.heroMonogramText}>
                {getInitials(progress.displayName || 'Hakan Tosun')}
              </Text>
            </View>
            <View style={styles.heroSchoolBadge}>
              <Ionicons name="school" size={12} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{progress.displayName || 'Hakan Tosun'}</Text>
          <Text style={styles.heroBio}>{progress.bio || 'Bilişsel Kaşif'}</Text>

          <View style={styles.heroPill}>
            <Ionicons name="sparkles-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.heroPillText}>
              {progress.username || '@hkan.dev'} • Seviye {currentLevel} • {totalXp} XP
            </Text>
          </View>
        </View>

        {/* 3. Real 3-Column Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconCircle}>
              <Ionicons name="layers-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statVal}>{progress.totalCardsReviewed || 0}</Text>
            <Text style={styles.statLabel}>Çalışılan Kart</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconCircle}>
              <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statVal}>{decks.length}</Text>
            <Text style={styles.statLabel}>Kişisel Deste</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.goldBg }]}>
              <Ionicons name="flame" size={18} color={colors.goldIcon} />
            </View>
            <Text style={styles.statVal}>{streakDays} Gün</Text>
            <Text style={styles.statLabel}>Günlük Seri</Text>
          </View>
        </View>

        {/* 4. Daily Goal with True Dynamic 0-100% Circular Ring */}
        <View style={styles.whiteCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Günlük Hedef</Text>
              <Text style={styles.cardSub}>Bugünkü öğrenme ilerlemen</Text>
            </View>
            <View style={styles.mintPill}>
              <Text style={styles.mintPillText}>
                {completedToday} / {goalToday} kart
              </Text>
            </View>
          </View>

          <View style={styles.dailyRow}>
            <View style={styles.circularGaugeContainer}>
              <View style={styles.gaugeTrack} />
              <View style={styles.gaugeHalfClipRight}>
                <View
                  style={[
                    styles.gaugeHalfCircleRight,
                    {
                      transform: [
                        {
                          rotate: `${-135 + (Math.min(50, dailyPercent) / 50) * 180}deg`,
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <View style={styles.gaugeHalfClipLeft}>
                <View
                  style={[
                    styles.gaugeHalfCircleLeft,
                    {
                      transform: [
                        {
                          rotate: `${-135 + (Math.max(0, dailyPercent - 50) / 50) * 180}deg`,
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <View style={styles.gaugeInner}>
                <Text style={styles.gaugeNumber}>%{dailyPercent}</Text>
                <Text style={styles.gaugeLabel}>BİTTİ</Text>
              </View>
            </View>

            <View style={styles.dailyDetails}>
              <Text style={styles.dailyDetailTitle}>
                {bookmarkedCount} Kayıtlı Kartın Var
              </Text>
              <Text style={styles.dailyDetailSub}>
                {completedToday >= goalToday
                  ? 'Bugünkü hedefini tamamladın! Harika gidiyorsun.'
                  : `Hedefe ${Math.max(0, goalToday - completedToday)} kart kaldı. Seriyi koru!`}
              </Text>
              <View style={styles.linearTrack}>
                <View style={[styles.linearFill, { width: `${dailyPercent}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 5. Expanded Realistic Badges Showcase (8 Progressive Badges) */}
        <View style={styles.whiteCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Kazanılan Rozetler</Text>
              <Text style={styles.cardSub}>Görevleri tamamladıkça rozetler açılır</Text>
            </View>
            <View style={styles.mintPill}>
              <Text style={styles.mintPillText}>
                {unlockedCount} / {badges.length} Açıldı
              </Text>
            </View>
          </View>

          <View style={styles.badgesGrid}>
            {badges.map(b => {
              const pct = Math.min(100, Math.round((b.current / Math.max(1, b.target)) * 100));
              return (
                <View
                  key={b.id}
                  style={[
                    styles.badgeCard,
                    b.unlocked && styles.badgeCardUnlocked,
                    !b.unlocked && { opacity: 0.72 },
                  ]}
                >
                  <View style={styles.badgeCardTop}>
                    <View
                      style={[
                        styles.badgeIconCircle,
                        {
                          backgroundColor: b.unlocked
                            ? colors.primary
                            : colors.surfaceContainer,
                        },
                      ]}
                    >
                      <Ionicons
                        name={b.unlocked ? b.icon : 'lock-closed'}
                        size={17}
                        color={b.unlocked ? colors.onPrimary : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.badgeProgressLabel,
                        b.unlocked && { color: colors.primary },
                      ]}
                    >
                      {b.unlocked ? 'Açıldı ✓' : `${b.current}/${b.target}`}
                    </Text>
                  </View>

                  <Text style={styles.badgeTitle} numberOfLines={1}>
                    {b.title}
                  </Text>
                  <Text style={styles.badgeDesc} numberOfLines={1}>
                    {b.desc}
                  </Text>

                  <View style={styles.badgeMiniTrack}>
                    <View
                      style={[
                        styles.badgeMiniFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: b.unlocked ? colors.primary : colors.textMuted,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 6. Application Settings Grouped Card */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsHeader}>UYGULAMA AYARLARI</Text>
          <View style={styles.settingsCard}>
            {/* Dark Mode Toggle */}
            <TouchableOpacity style={styles.settingRow} onPress={toggleTheme} activeOpacity={0.75}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBox}>
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny-outline'}
                    size={19}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Koyu Tema</Text>
                  <Text style={styles.settingSub}>
                    {isDark ? 'Açık • Göz yormayan koyu görünüm' : 'Kapalı • Açık görünüm aktif'}
                  </Text>
                </View>
              </View>
              <View style={[styles.toggleTrack, isDark && styles.toggleTrackOn]}>
                <View
                  style={[
                    styles.toggleThumb,
                    isDark && styles.toggleThumbOn,
                    isDark && { backgroundColor: colors.onPrimary },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} onPress={openEditModal} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBox}>
                  <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Profili Düzenle</Text>
                  <Text style={styles.settingSub}>İsim, kullanıcı adı ve biyografi</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} onPress={openEditModal} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBox}>
                  <Ionicons name="flag-outline" size={19} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Günlük Hedef</Text>
                  <Text style={styles.settingSub}>Günde {goalToday} kart</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBox}>
                  <Ionicons name="notifications-outline" size={19} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Çalışma Bildirimleri</Text>
                  <Text style={styles.settingSub}>
                    {notifEnabled ? 'Açık (20:00)' : 'Kapalı'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggleTrack, notifEnabled && styles.toggleTrackOn]}
                onPress={() => setNotifEnabled(prev => !prev)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    notifEnabled && styles.toggleThumbOn,
                    notifEnabled && isDark && { backgroundColor: colors.onPrimary },
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleResetData}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBox, { backgroundColor: colors.errorSoftBg }]}>
                  <Ionicons name="trash-outline" size={19} color={colors.error} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.error }]}>
                    Demo Verilerini Sıfırla
                  </Text>
                  <Text style={styles.settingSub}>İlerleme ve istatistikleri başa sar</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ReelLearn v1.2.0 • Sınavlara Akıllı Hazırlık</Text>
          <Text style={styles.footerSub}>Hafıza & Odaklanma Alanı</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal (No Photo Picker) */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profili Düzenle</Text>
                <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ad Soyad</Text>
                <TextInput
                  style={styles.formInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Adınız..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kullanıcı Adı</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="@kullanici"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ünvan / Biyografi</Text>
                <TextInput
                  style={styles.formInput}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Örn: Bilgisayar Mühendisliği Öğrencisi"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Günlük Kart Hedefi</Text>
                <TextInput
                  style={styles.formInput}
                  value={editDailyGoal}
                  onChangeText={setEditDailyGoal}
                  keyboardType="number-pad"
                  placeholder="15"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsEditModalOpen(false)}
                >
                  <Text style={styles.cancelBtnText}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                  <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
  editTopBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 16,
  },
  heroSection: {
    alignItems: 'center',
  },
  heroMonogramRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    padding: 4,
    backgroundColor: colors.primaryPillBg,
    position: 'relative',
  },
  heroMonogramInner: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMonogramText: {
    color: colors.onPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSchoolBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  heroName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  heroBio: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  heroPill: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroPillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statVal: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  whiteCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  mintPill: {
    backgroundColor: colors.primaryPillBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mintPillText: {
    color: colors.primaryPillText,
    fontSize: 11,
    fontWeight: '700',
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circularGaugeContainer: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 7,
    borderColor: colors.border,
  },
  gaugeHalfClipRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 42,
    height: 84,
    overflow: 'hidden',
  },
  gaugeHalfCircleRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 7,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
    borderRightColor: colors.primary,
  },
  gaugeHalfClipLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 42,
    height: 84,
    overflow: 'hidden',
  },
  gaugeHalfCircleLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 7,
    borderColor: 'transparent',
    borderBottomColor: colors.primary,
    borderLeftColor: colors.primary,
  },
  gaugeInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNumber: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  gaugeLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  dailyDetails: {
    flex: 1,
    gap: 4,
  },
  dailyDetailTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  dailyDetailSub: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  linearTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
    marginTop: 4,
  },
  linearFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  // 2-column realistic badge grid
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  badgeCardUnlocked: {
    backgroundColor: colors.primarySoftBg,
    borderColor: colors.primarySoftBorder,
  },
  badgeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeProgressLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  badgeDesc: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  badgeMiniTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
    marginTop: 8,
  },
  badgeMiniFill: {
    height: '100%',
    borderRadius: 2,
  },
  settingsSection: {
    gap: 8,
  },
  settingsHeader: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingLeft: 4,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.surfaceLow,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.toggleOffBg,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  footerSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  formInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
