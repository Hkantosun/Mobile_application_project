import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { StorageService } from '../services/storageService';
import { AIService } from '../services/aiService';
import { Card, Deck, UserProgress } from '../types';
import { INITIAL_USER_PROGRESS } from '../constants/initialData';
import { useAppTheme, AppColors } from '../context/ThemeContext';
import { useBadges } from '../context/BadgeContext';

export const DeckListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { checkBadges } = useBadges();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [progress, setProgress] = useState<UserProgress>(INITIAL_USER_PROGRESS);
  const [searchQuery, setSearchQuery] = useState('');

  // AI PDF & Lecture Note Analyzer Modal states (API key comes from .env.local automatically)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [pickedFile, setPickedFile] = useState<{
    name: string;
    uri: string;
    mimeType?: string;
    size?: number;
  } | null>(null);
  const [pastedNotes, setPastedNotes] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(6);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const loadData = useCallback(async () => {
    const [loadedDecks, loadedCards, loadedProgress] = await Promise.all([
      StorageService.getDecks(),
      StorageService.getCards(),
      StorageService.getProgress(),
    ]);
    setDecks(loadedDecks);
    setCards(loadedCards);
    setProgress(loadedProgress);
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // Filtered decks based on search query only (no category chips per user preference)
  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return decks;
    const q = searchQuery.toLowerCase();
    return decks.filter(
      deck =>
        deck.title.toLowerCase().includes(q) ||
        deck.description.toLowerCase().includes(q) ||
        deck.category.toLowerCase().includes(q)
    );
  }, [decks, searchQuery]);

  const handleStartDeck = (deck: Deck) => {
    navigation.navigate('Akış', { deckId: deck.id });
  };

  const handleDeleteDeck = (deck: Deck) => {
    Alert.alert(
      'Desteyi Sil',
      `"${deck.title}" destesi ve içindeki kartlar silinecek. Emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteDeck(deck.id);
            loadData();
          },
        },
      ]
    );
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'text/markdown'],
        copyToCacheDirectory: Platform.OS !== 'android',
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPickedFile({
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType,
          size: asset.size,
        });
      }
    } catch (error) {
      console.error('Document pick failed:', error);
      Alert.alert('Hata', 'Dosya seçilirken bir sorun oluştu.');
    }
  };

  const readUriAsBase64 = async (uri: string): Promise<string> => {
    try {
      const localFile = new File(uri);
      return await localFile.base64();
    } catch {
      const res = await fetch(uri);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Dosya base64 olarak okunamadı.'));
        reader.readAsDataURL(blob);
      });
    }
  };

  const readUriAsText = async (uri: string): Promise<string> => {
    try {
      const localFile = new File(uri);
      return await localFile.text();
    } catch {
      const res = await fetch(uri);
      return await res.text();
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!pickedFile && !pastedNotes.trim()) {
      Alert.alert(
        'Belge veya Not Gerekli',
        'Lütfen bir PDF/TXT dosyası seçin veya ders notu metnini yapıştırın.'
      );
      return;
    }

    try {
      setIsGeneratingAI(true);

      let pdfBase64: string | undefined;
      let textContent = pastedNotes.trim();

      if (pickedFile) {
        const isPdf =
          pickedFile.mimeType?.includes('pdf') ||
          pickedFile.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
          pdfBase64 = await readUriAsBase64(pickedFile.uri);
        } else {
          const fileText = await readUriAsText(pickedFile.uri);
          textContent = textContent ? `${fileText}\n\n${textContent}` : fileText;
        }
      }

      const { deck, cards: generatedCards } = await AIService.generateFlashcardsFromContent({
        fileName: pickedFile?.name,
        pdfBase64,
        textContent,
        questionCount,
      });

      await StorageService.addDeckWithCards(deck, generatedCards);
      setPickedFile(null);
      setPastedNotes('');
      setIsAIModalOpen(false);
      await loadData();
      checkBadges();

      Alert.alert(
        'Yapay Zekâ Hazır! ✨',
        `"${deck.title}" destesi ve ${generatedCards.length} adet şıklı soru akışa eklendi.`,
        [
          { text: 'Destelerde Kal', style: 'cancel' },
          {
            text: 'Akışta Çöz 🚀',
            onPress: () => navigation.navigate('Akış', { deckId: deck.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Analiz Hatası',
        error?.message || 'PDF analiz edilirken bir hata oluştu.'
      );
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const todayCount = progress.todayCompletedCount || 0;
  const dailyGoal = progress.dailyGoal || 15;
  const dailyGoalPct = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <View style={styles.logoMark}>
            <Ionicons name="leaf" size={15} color={colors.onPrimary} />
          </View>
          <Text style={styles.brandName}>ReelLearn</Text>
          <Text style={styles.brandSub}>• Desteler</Text>
        </View>

        <View style={styles.topBarRight}>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={15} color={colors.goldIcon} />
            <Text style={styles.streakText}>{progress.streak || 0} Gün</Text>
          </View>

          <TouchableOpacity
            style={styles.profileIconBtn}
            onPress={() => navigation.navigate('Profil')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
      >
        {/* 2. Title */}
        <View style={styles.headerSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Destelerim</Text>
            <Text style={styles.pageSubtitle}>
              PDF veya ders notlarını yükle, yapay zekâ ile çalışmaya başla.
            </Text>
          </View>
        </View>

        {/* 3. Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Deste veya konu ara..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Study Goal Overview Bento Card (Real Data) */}
        <View style={styles.goalBento}>
          <View style={styles.goalBentoLeft}>
            <View style={styles.goalIconBox}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.goalBentoLabel}>GÜNLÜK HEDEF</Text>
              <Text style={styles.goalBentoTitle}>
                {todayCount} / {dailyGoal} Kart Çalışıldı
              </Text>
            </View>
          </View>
          <View style={styles.goalPctBadge}>
            <Text style={styles.goalPctText}>%{dailyGoalPct}</Text>
          </View>
        </View>

        {/* 5. Deck Cards List OR Clean Empty State */}
        <View style={styles.decksList}>
          {filteredDecks.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Henüz Kişisel Deste Yok</Text>
              <Text style={styles.emptySub}>
                Aşağıdaki Akıllı Kart Üretici ile PDF veya ders notunu yükle; yapay zekâ senin için 4 şıklı akış soruları oluştursun.
              </Text>
            </View>
          ) : (
            filteredDecks.map(deck => {
              const deckCards = cards.filter(c => c.deckId === deck.id);
              const totalCount = deckCards.length || deck.cardCount;
              const reviewedCount = deckCards.filter(c => c.repetitionCount >= 1).length;
              const deckPct = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

              return (
                <View key={deck.id} style={styles.deckCard}>
                  <View style={styles.deckCardTop}>
                    <View style={styles.deckCardLeft}>
                      <View style={styles.deckIconBox}>
                        <Ionicons
                          name={(deck.iconName as any) || 'sparkles'}
                          size={22}
                          color={colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deckTitle} numberOfLines={1}>
                          {deck.title}
                        </Text>
                        <Text style={styles.deckMeta} numberOfLines={1}>
                          {deck.category} • {totalCount} Kart
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteDeck(deck)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.deckDesc} numberOfLines={2}>
                    {deck.description}
                  </Text>

                  {/* Progress */}
                  <View style={styles.deckProgressBlock}>
                    <View style={styles.deckProgressRow}>
                      <Text style={styles.deckProgressText}>
                        {reviewedCount}/{totalCount} kart çalışıldı
                      </Text>
                      <Text style={styles.deckProgressPct}>Tamamlanan: %{deckPct}</Text>
                    </View>
                    <View style={styles.deckTrack}>
                      <View style={[styles.deckFill, { width: `${deckPct}%` }]} />
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.deckFooter}>
                    <View style={styles.deckAiTag}>
                      <Ionicons name="sparkles-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.deckAiTagText}>Aktif Hatırlama</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.startDeckBtn}
                      onPress={() => handleStartDeck(deck)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.startDeckBtnText}>Çalışmaya Başla</Text>
                      <Ionicons name="arrow-forward" size={15} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 6. Smart Deck Creation Banner / AI Quick Action */}
        <View style={styles.aiBannerCard}>
          <View style={styles.aiBannerDeco} pointerEvents="none" />
          <View style={styles.aiBannerTop}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={styles.aiBannerKickerRow}>
                <Ionicons name="sparkles" size={14} color={colors.bannerSub} />
                <Text style={styles.aiBannerKicker}>Akıllı Kart Üretici</Text>
              </View>
              <Text style={styles.aiBannerTitle}>
                Ders Notlarından Otomatik Deste Hazırla
              </Text>
              <Text style={styles.aiBannerSub}>
                PDF veya ders notunu yükle; ReelLearn yapay zekâsı anında 4 şıklı soru kartlarına dönüştürsün.
              </Text>
            </View>
            <View style={styles.aiBannerIconCircle}>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.bannerTitle} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.aiBannerCtaBtn}
            onPress={() => setIsAIModalOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text-outline" size={17} color={colors.bannerBtnText} />
            <Text style={styles.aiBannerCtaText}>PDF / Not Yükle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 7. AI PDF & LECTURE NOTE ANALYZER MODAL (Zero API Key UI) */}
      <Modal
        visible={isAIModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isGeneratingAI) setIsAIModalOpen(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { maxHeight: '88%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={styles.aiModalTitleRow}>
                  <View style={styles.aiSparkleBadge}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Yapay Zekâ PDF Analizi</Text>
                </View>
                <TouchableOpacity
                  onPress={() => !isGeneratingAI && setIsAIModalOpen(false)}
                  disabled={isGeneratingAI}
                >
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.aiModalIntro}>
                PDF veya ders notunu yükle; yapay zekâ içeriği analiz ederek 4 şıklı akış sorularını otomatik oluştursun.
              </Text>

              {/* PDF / File Picker */}
              <Text style={styles.inputLabel}>1. PDF veya Metin Dosyası Seç</Text>
              {pickedFile ? (
                <View style={styles.pickedFileCard}>
                  <View style={styles.pickedFileLeft}>
                    <Ionicons name="document-attach" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickedFileName} numberOfLines={1}>
                        {pickedFile.name}
                      </Text>
                      {pickedFile.size && (
                        <Text style={styles.pickedFileSize}>
                          {Math.round(pickedFile.size / 1024)} KB • Hazır
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setPickedFile(null)} disabled={isGeneratingAI}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickPdfBtn}
                  onPress={handlePickDocument}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                  <Text style={styles.pickPdfBtnText}>PDF / Ders Notu Dosyası Seç</Text>
                </TouchableOpacity>
              )}

              {/* Or Paste Lecture Notes */}
              <Text style={styles.inputLabel}>
                2. Veya Ders Notunu Doğrudan Yapıştır (İsteğe Bağlı)
              </Text>
              <TextInput
                style={[styles.modalInput, { height: 84, textAlignVertical: 'top' }]}
                placeholder="PDF yüklemeden doğrudan ders notlarını buraya yapıştırabilirsin..."
                placeholderTextColor={colors.textMuted}
                value={pastedNotes}
                onChangeText={setPastedNotes}
                multiline
              />

              {/* Question Count Selector */}
              <Text style={styles.inputLabel}>Üretilecek Soru Sayısı</Text>
              <View style={styles.countSelectorRow}>
                {[4, 6, 8, 10].map(cnt => {
                  const active = questionCount === cnt;
                  return (
                    <TouchableOpacity
                      key={cnt}
                      style={[styles.countPill, active && styles.countPillActive]}
                      onPress={() => setQuestionCount(cnt)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.countPillText, active && styles.countPillTextActive]}>
                        {cnt} Soru
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Analyze & Generate CTA */}
              <TouchableOpacity
                style={[styles.submitBtn, isGeneratingAI && { opacity: 0.7 }]}
                onPress={handleAnalyzeWithAI}
                disabled={isGeneratingAI}
                activeOpacity={0.85}
              >
                {isGeneratingAI ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                    <Text style={styles.submitBtnText}>
                      Yapay Zekâ PDF'i Analiz Ediyor...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.loadingRow}>
                    <Ionicons name="sparkles" size={17} color={colors.onPrimary} />
                    <Text style={styles.submitBtnText}>
                      Analiz Et & Akış Soruları Oluştur
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
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
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  newDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  newDeckBtnText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  goalBento: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  goalBentoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBentoLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  goalBentoTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  goalPctBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPctText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  decksList: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  deckCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  deckCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  deckCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deckIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  deckMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.errorSoftBg,
  },
  deckDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  deckProgressBlock: {
    gap: 5,
  },
  deckProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckProgressText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  deckProgressPct: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  deckTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  deckFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  deckFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  deckAiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deckAiTagText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  startDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  startDeckBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  aiBannerCard: {
    backgroundColor: colors.bannerBg,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  aiBannerDeco: {
    position: 'absolute',
    right: -24,
    bottom: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(153, 210, 185, 0.14)',
  },
  aiBannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  aiBannerKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  aiBannerKicker: {
    color: colors.bannerSub,
    fontSize: 11,
    fontWeight: '700',
  },
  aiBannerTitle: {
    color: colors.bannerTitle,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  aiBannerSub: {
    color: colors.bannerSub,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    opacity: 0.9,
  },
  aiBannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bannerIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerCtaBtn: {
    backgroundColor: colors.bannerBtnBg,
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  aiBannerCtaText: {
    color: colors.bannerBtnText,
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  switchLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  switchToggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.toggleOffBg,
    padding: 3,
  },
  switchToggleOn: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbOn: {
    transform: [{ translateX: 20 }],
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  submitBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  aiModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiSparkleBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoftBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalIntro: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  pickPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLow,
  },
  pickPdfBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  pickedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pickedFileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  pickedFileName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  pickedFileSize: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 2,
  },
  countSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  countPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  countPillActive: {
    backgroundColor: colors.primarySoftBg,
    borderColor: colors.primary,
  },
  countPillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  countPillTextActive: {
    color: colors.primary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
