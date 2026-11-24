import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuizQuestion } from '../types';
import { useAppTheme, AppColors } from '../context/ThemeContext';

interface QuizModalProps {
  visible: boolean;
  quiz?: QuizQuestion;
  onClose: () => void;
  onAnswerCorrect: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  visible,
  quiz,
  onClose,
  onAnswerCorrect,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  if (!quiz) return null;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
    setIsAnswered(true);

    if (index === quiz.correctAnswerIndex) {
      onAnswerCorrect();
    }
  };

  const handleClose = () => {
    setSelectedIndex(null);
    setIsAnswered(false);
    onClose();
  };

  const isCorrect = selectedIndex === quiz.correctAnswerIndex;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={styles.topicPill}>
                <Ionicons name="help-circle" size={15} color={colors.primary} />
                <Text style={styles.topicPillText}>MİNİ QUİZ</Text>
              </View>

              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.questionText}>{quiz.question}</Text>

            <View style={styles.optionsList}>
              {quiz.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedIndex === idx;
                const isCorrectOption = idx === quiz.correctAnswerIndex;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionItem,
                      isAnswered && isCorrectOption && styles.optionCorrect,
                      isAnswered && isSelected && !isCorrectOption && styles.optionWrong,
                    ]}
                    onPress={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.letterCircle,
                        isAnswered && isCorrectOption && styles.circleCorrect,
                        isAnswered && isSelected && !isCorrectOption && styles.circleWrong,
                      ]}
                    >
                      {isAnswered && isCorrectOption ? (
                        <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                      ) : isAnswered && isSelected ? (
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.letterText, { color: colors.textMuted }]}>
                          {letter}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isAnswered && (
              <View
                style={[
                  styles.feedbackBox,
                  isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackTitle,
                    { color: isCorrect ? colors.primary : colors.error },
                  ]}
                >
                  {isCorrect ? 'Doğru! +25 XP Kazandın ✨' : 'Açıklama'}
                </Text>
                <Text style={styles.explanationText}>{quiz.explanation}</Text>
              </View>
            )}

            {isAnswered && (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>Akışa Devam Et</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  topicPillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 23,
    marginBottom: 14,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 10,
  },
  optionCorrect: {
    backgroundColor: colors.primarySoftBg,
    borderColor: colors.primary,
  },
  optionWrong: {
    backgroundColor: colors.errorSoftBg,
    borderColor: colors.error,
  },
  letterCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCorrect: {
    backgroundColor: colors.primary,
  },
  circleWrong: {
    backgroundColor: colors.error,
  },
  letterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  feedbackBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: colors.primarySoftBg,
    borderColor: colors.primarySoftBorder,
  },
  feedbackWrong: {
    backgroundColor: colors.errorSoftBg,
    borderColor: colors.error,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  continueBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
