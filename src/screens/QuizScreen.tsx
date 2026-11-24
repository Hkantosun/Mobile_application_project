import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';
import { calculateProgressUpdate } from '../utils/spacedRepetition';
import { INITIAL_CARDS, INITIAL_USER_PROGRESS } from '../constants/initialData';
import { UserProgress } from '../types';
import { useAppTheme, AppColors } from '../context/ThemeContext';
import { useBadges } from '../context/BadgeContext';

interface QuizItem {
  id: string;
  topic: string;
  question: string;
  subtitle?: string;
  codeSnippet?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export const QuizScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { checkBadges } = useBadges();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [progress, setProgress] = useState<UserProgress>(INITIAL_USER_PROGRESS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(45);

  const loadQuizData = useCallback(async () => {
    const [loadedCards, loadedProgress] = await Promise.all([
      StorageService.getCards(),
      StorageService.getProgress(),
    ]);
    setProgress(loadedProgress);

    const sourceCards = loadedCards.length > 0 ? loadedCards : INITIAL_CARDS;
    const withQuiz: QuizItem[] = sourceCards
      .filter(c => c.quiz && c.quiz.options && c.quiz.options.length >= 2)
      .slice(0, 6)
      .map(c => ({
        id: c.quiz!.id,
        topic: c.topic || 'Genel',
        question: c.quiz!.question || c.front,
        subtitle: c.front !== c.quiz!.question ? c.front : undefined,
        codeSnippet: c.codeSnippet,
        options: c.quiz!.options,
        correctAnswerIndex: c.quiz!.correctAnswerIndex,
        explanation: c.quiz!.explanation || c.back,
      }));

    setQuizItems(withQuiz);
  }, []);

  useEffect(() => {
    loadQuizData();
    const unsubscribe = navigation?.addListener?.('focus', loadQuizData);
    return unsubscribe;
  }, [navigation, loadQuizData]);

  // Countdown timer
  useEffect(() => {
    if (quizFinished || isConfirmed || quizItems.length === 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev <= 1 ? 45 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [quizFinished, isConfirmed, currentIndex, quizItems.length]);

  const currentQuiz = quizItems[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isConfirmed) return;
    setSelectedOption(idx);
  };

  const handleConfirmOrNext = async () => {
    if (!currentQuiz) return;

    if (!isConfirmed) {
      if (selectedOption === null) return;
      setIsConfirmed(true);
      if (selectedOption === currentQuiz.correctAnswerIndex) {
        setCorrectCount(prev => prev + 1);
      }
      return;
    }

    if (currentIndex < quizItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsConfirmed(false);
      setSecondsLeft(45);
    } else {
      const earnedXp = Math.max(15, correctCount * 25);
      try {
        const currentProgress = await StorageService.getProgress();
        const updated = calculateProgressUpdate(currentProgress, earnedXp);
        await StorageService.saveProgress(updated);
        setProgress(updated);
        checkBadges();
      } catch (err) {
        console.error('Quiz progress save failed:', err);
      }
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsConfirmed(false);
    setCorrectCount(0);
    setQuizFinished(false);
    setSecondsLeft(45);
  };

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <View style={styles.brandGroup}>
        <View style={styles.logoMark}>
          <Ionicons name="leaf" size={15} color={colors.onPrimary} />
        </View>
        <Text style={styles.brandName}>ReelLearn</Text>
        <Text style={styles.brandSub}>• Mini Quiz</Text>
      </View>

      <View style={styles.topBarRight}>
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={15} color={colors.goldIcon} />
          <Text style={styles.streakText}>{progress.streak || 0} Gün</Text>
        </View>

        <TouchableOpacity
          style={styles.profileIconBtn}
          onPress={() => navigation?.navigate?.('Profil')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (quizFinished) {
    const totalXp = Math.max(15, correctCount * 25);
    const accuracyPct =
      quizItems.length > 0 ? Math.round((correctCount / quizItems.length) * 100) : 0;

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {renderTopBar()}
        <View style={styles.resultsWrapper}>
          <View style={styles.resultsCard}>
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy" size={44} color={colors.primary} />
            </View>
            <Text style={styles.resultsTitle}>Mini Quiz Tamamlandı!</Text>
            <Text style={styles.resultsSub}>
              Aktif hatırlama modunda tüm soruları başarıyla tamamladın.
            </Text>

            <View style={styles.resultsStatsRow}>
              <View style={styles.resultStatBox}>
                <Text style={styles.resultStatVal}>
                  {correctCount}/{quizItems.length}
                </Text>
                <Text style={styles.resultStatLabel}>Doğru</Text>
              </View>
              <View style={styles.resultStatDivider} />
              <View style={styles.resultStatBox}>
                <Text style={[styles.resultStatVal, { color: colors.primary }]}>
                  %{accuracyPct}
                </Text>
                <Text style={styles.resultStatLabel}>Başarı</Text>
              </View>
              <View style={styles.resultStatDivider} />
              <View style={styles.resultStatBox}>
                <Text style={[styles.resultStatVal, { color: colors.primary }]}>
                  +{totalXp} XP
                </Text>
                <Text style={styles.resultStatLabel}>Kazanım</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleRestartQuiz}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color={colors.onPrimary} />
              <Text style={styles.primaryActionText}>Testi Tekrar Çöz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuiz) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {renderTopBar()}
        <View style={styles.resultsWrapper}>
          <Text style={styles.resultsSub}>Quiz soruları yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / quizItems.length) * 100);
  const isCurrentCorrect = selectedOption === currentQuiz.correctAnswerIndex;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {renderTopBar()}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header & Context */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Mini Quiz</Text>
            <Text style={styles.pageSub}>Bilgilerini test et.</Text>
          </View>
          <View style={styles.topicContextPill}>
            <Ionicons name="book" size={13} color={colors.primary} />
            <Text style={styles.topicContextText} numberOfLines={1}>
              {currentQuiz.topic}
            </Text>
          </View>
        </View>

        {/* 2. Progress Indicator Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressMetaRow}>
            <View style={styles.progressLeft}>
              <View style={styles.progressDot} />
              <Text style={styles.progressStepText}>
                Soru {currentIndex + 1} / {quizItems.length}
              </Text>
            </View>
            <Text style={styles.progressPctText}>%{progressPct} Tamamlandı</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* 3. Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionTopAccent} />

          <View style={styles.questionMetaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{currentQuiz.topic}</Text>
            </View>
            <View style={styles.timerGroup}>
              <Ionicons name="timer-outline" size={15} color={colors.textMuted} />
              <Text style={styles.timerText}>{secondsLeft}s</Text>
            </View>
          </View>

          <Text style={styles.questionTitle}>{currentQuiz.question}</Text>
          {currentQuiz.subtitle && (
            <Text style={styles.questionSubtitle}>{currentQuiz.subtitle}</Text>
          )}

          {currentQuiz.codeSnippet && (
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{currentQuiz.codeSnippet}</Text>
            </View>
          )}
        </View>

        {/* 4. Answer Options */}
        <View style={styles.optionsList}>
          {currentQuiz.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = selectedOption === idx;
            const isCorrectOpt = idx === currentQuiz.correctAnswerIndex;

            let letterTextColor = colors.textMuted;
            let optTextColor = colors.textPrimary;

            if (isConfirmed) {
              if (isCorrectOpt) {
                letterTextColor = colors.onPrimary;
                optTextColor = colors.primary;
              } else if (isSelected) {
                letterTextColor = '#FFFFFF';
                optTextColor = colors.errorSoftText;
              }
            } else if (isSelected) {
              letterTextColor = colors.onPrimary;
              optTextColor = colors.primary;
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  !isConfirmed && isSelected && styles.optionCardSelected,
                  isConfirmed && isCorrectOpt && styles.optionCardCorrect,
                  isConfirmed && isSelected && !isCorrectOpt && styles.optionCardWrong,
                ]}
                onPress={() => handleSelectOption(idx)}
                disabled={isConfirmed}
                activeOpacity={0.85}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.letterCircle,
                      ((!isConfirmed && isSelected) || (isConfirmed && isCorrectOpt)) &&
                        styles.letterCirclePrimary,
                      isConfirmed && isSelected && !isCorrectOpt && styles.letterCircleWrong,
                    ]}
                  >
                    <Text style={[styles.letterText, { color: letterTextColor }]}>
                      {letter}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optionText,
                        { color: optTextColor },
                        (isSelected || (isConfirmed && isCorrectOpt)) && { fontWeight: '700' },
                      ]}
                    >
                      {opt}
                    </Text>
                    {!isConfirmed && isSelected && (
                      <Text style={styles.selectedSubLabel}>Seçilen yanıt</Text>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.radioIndicator,
                    !isConfirmed && isSelected && styles.radioIndicatorSelected,
                    isConfirmed && isCorrectOpt && styles.radioIndicatorSelected,
                    isConfirmed && isSelected && !isCorrectOpt && styles.radioIndicatorWrong,
                  ]}
                >
                  {((!isConfirmed && isSelected) || (isConfirmed && isCorrectOpt)) && (
                    <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                  )}
                  {isConfirmed && isSelected && !isCorrectOpt && (
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. Educational Spaced Repetition Note / Explanation */}
        <View
          style={[
            styles.noteBox,
            isConfirmed &&
              (isCurrentCorrect ? styles.noteBoxCorrect : styles.noteBoxWrong),
          ]}
        >
          <Ionicons
            name={
              !isConfirmed
                ? 'checkmark-circle'
                : isCurrentCorrect
                ? 'checkmark-circle'
                : 'alert-circle'
            }
            size={19}
            color={!isConfirmed || isCurrentCorrect ? colors.primary : colors.error}
            style={{ marginTop: 1 }}
          />
          <Text style={styles.noteText}>
            <Text
              style={[
                styles.noteBold,
                { color: !isConfirmed || isCurrentCorrect ? colors.primary : colors.error },
              ]}
            >
              {!isConfirmed
                ? 'Aralıklı Tekrar: '
                : isCurrentCorrect
                ? 'Doğru! (+25 XP) '
                : 'Açıklama: '}
            </Text>
            {isConfirmed
              ? currentQuiz.explanation
              : 'Doğru yanıtlanan kartlar aralığı genişletilerek uzun süreli hafızaya aktarılır.'}
          </Text>
        </View>

        {/* 6. Footer Confirmation / Next Action */}
        <TouchableOpacity
          style={[
            styles.primaryActionBtn,
            !isConfirmed && selectedOption === null && styles.primaryActionBtnDisabled,
          ]}
          onPress={handleConfirmOrNext}
          disabled={!isConfirmed && selectedOption === null}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryActionText}>
            {!isConfirmed
              ? 'Cevabı Onayla'
              : currentIndex < quizItems.length - 1
              ? 'Sonraki Soruya Geç'
              : 'Sonuçları Gör'}
          </Text>
          <Ionicons name="arrow-forward" size={17} color={colors.onPrimary} />
        </TouchableOpacity>

        <View style={styles.footerHintRow}>
          <Ionicons name="hardware-chip-outline" size={14} color={colors.textMuted} />
          <Text style={styles.footerHintText}>
            Doğru yanıtlar bir sonraki tekrar aralığınızı uzatır.
          </Text>
        </View>
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pageSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 1,
  },
  topicContextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 5,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxWidth: 160,
  },
  topicContextText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressStepText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressPctText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
  questionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  timerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  questionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  questionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  codeBox: {
    backgroundColor: colors.codeBg,
    borderRadius: 10,
    padding: 10,
  },
  codeText: {
    color: colors.codeText,
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 17,
  },
  optionsList: {
    gap: 9,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionCardSelected: {
    backgroundColor: colors.primarySoftBg,
    borderColor: colors.primary,
  },
  optionCardCorrect: {
    backgroundColor: colors.primarySoftBg,
    borderColor: colors.primary,
  },
  optionCardWrong: {
    backgroundColor: colors.errorSoftBg,
    borderColor: colors.error,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  letterCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCirclePrimary: {
    backgroundColor: colors.primary,
  },
  letterCircleWrong: {
    backgroundColor: colors.error,
  },
  letterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  selectedSubLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorSelected: {
    backgroundColor: colors.primary,
  },
  radioIndicatorWrong: {
    backgroundColor: colors.error,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: colors.surfaceLow,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  noteBoxCorrect: {
    backgroundColor: colors.primarySoftBg,
    borderColor: colors.primarySoftBorder,
  },
  noteBoxWrong: {
    backgroundColor: colors.errorSoftBg,
    borderColor: colors.error,
  },
  noteText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  noteBold: {
    fontWeight: '700',
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryActionBtnDisabled: {
    backgroundColor: colors.toggleOffBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryActionText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerHintText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  resultsWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  resultsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  trophyCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  resultsSub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  resultsStatsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  resultStatVal: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  resultStatLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  resultStatDivider: {
    width: 1,
    backgroundColor: colors.borderSubtle,
  },
});
