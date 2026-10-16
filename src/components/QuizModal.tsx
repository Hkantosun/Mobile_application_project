import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuizQuestion } from '../types';
import { THEME } from '../constants/theme';

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="flash" size={14} color={THEME.colors.accentYellow} />
              <Text style={styles.badgeText}>Aktif Hatırlama Mini Testi</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{quiz.question}</Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {quiz.options.map((option, idx) => {
              let optionStyle = styles.optionItem;
              let textColor = THEME.colors.textPrimary;
              let iconName: any = 'radio-button-off';
              let iconColor = THEME.colors.textMuted;

              if (isAnswered) {
                if (idx === quiz.correctAnswerIndex) {
                  optionStyle = { ...optionStyle, ...styles.optionCorrect };
                  textColor = '#10B981';
                  iconName = 'checkmark-circle';
                  iconColor = '#10B981';
                } else if (idx === selectedIndex) {
                  optionStyle = { ...optionStyle, ...styles.optionIncorrect };
                  textColor = '#EF4444';
                  iconName = 'close-circle';
                  iconColor = '#EF4444';
                }
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={optionStyle}
                  onPress={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  activeOpacity={0.7}
                >
                  <Ionicons name={iconName} size={18} color={iconColor} style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Result & Explanation */}
          {isAnswered && (
            <View
              style={[
                styles.feedbackBox,
                isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
              ]}
            >
              <View style={styles.feedbackTitleRow}>
                <Ionicons
                  name={isCorrect ? 'trophy' : 'alert-circle'}
                  size={18}
                  color={isCorrect ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.feedbackTitle,
                    { color: isCorrect ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {isCorrect ? 'Tebrikler! +25 XP Kazandın' : 'Yanlış Cevap! Tekrar İncele'}
                </Text>
              </View>
              <Text style={styles.explanationText}>{quiz.explanation}</Text>
            </View>
          )}

          {/* Bottom Button */}
          {isAnswered && (
            <TouchableOpacity style={styles.continueBtn} onPress={handleClose}>
              <Text style={styles.continueBtnText}>Akışa Devam Et</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000B3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF241F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: '#FBBF2444',
  },
  badgeText: {
    color: THEME.colors.accentYellow,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  closeBtn: {
    padding: 4,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 25,
    marginBottom: THEME.spacing.lg,
  },
  optionsList: {
    gap: 10,
    marginBottom: THEME.spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2338',
    padding: 14,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#2E3854',
  },
  optionCorrect: {
    backgroundColor: '#10B9811A',
    borderColor: '#10B981',
  },
  optionIncorrect: {
    backgroundColor: '#EF44441A',
    borderColor: '#EF4444',
  },
  optionIcon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  feedbackBox: {
    padding: 12,
    borderRadius: THEME.borderRadius.md,
    marginVertical: 10,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: '#10B98114',
    borderColor: '#10B98144',
  },
  feedbackIncorrect: {
    backgroundColor: '#EF444414',
    borderColor: '#EF444444',
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  explanationText: {
    fontSize: 12,
    color: THEME.colors.textLight,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
