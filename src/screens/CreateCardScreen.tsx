import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';
import { Card, Deck, FeedType } from '../types';
import { THEME } from '../constants/theme';

export const CreateCardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [feedType, setFeedType] = useState<FeedType>('study');
  const [topic, setTopic] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  
  // Optional Mini-quiz
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);

  useEffect(() => {
    const loadDecks = async () => {
      const loaded = await StorageService.getDecks();
      setDecks(loaded);
      if (loaded.length > 0) {
        setSelectedDeckId(loaded[0].id);
      }
    };
    loadDecks();
  }, []);

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Eksik Alan', 'Lütfen kartın ön yüzünü (soru) ve arka yüzünü (cevap) doldurun.');
      return;
    }

    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }

    const newCard: Card = {
      id: `card-${Date.now()}`,
      deckId: selectedDeckId || (decks[0]?.id ?? 'default-deck'),
      type: feedType,
      topic: topic.trim() || (feedType === 'study' ? 'Ders' : 'Genel Kültür'),
      front: front.trim(),
      back: back.trim(),
      codeSnippet: codeSnippet.trim() || undefined,
      difficulty: 'medium',
      repetitionCount: 0,
      intervalDays: 1,
      nextReviewDate: Date.now() + 86400000,
      isBookmarked: false,
    };

    if (includeQuiz && quizQuestion.trim() && opt1.trim() && opt2.trim()) {
      const options = [opt1.trim(), opt2.trim()];
      if (opt3.trim()) options.push(opt3.trim());
      if (opt4.trim()) options.push(opt4.trim());

      newCard.quiz = {
        id: `quiz-${Date.now()}`,
        cardId: newCard.id,
        question: quizQuestion.trim(),
        options,
        correctAnswerIndex: Math.min(correctIdx, options.length - 1),
        explanation: back.trim().slice(0, 120),
      };
    }

    await StorageService.addCard(newCard);

    Alert.alert('Başarılı! 🎉', 'Kartınız başarıyla oluşturuldu ve akışınıza eklendi.', [
      {
        text: 'Akışa Git',
        onPress: () => {
          setFront('');
          setBack('');
          setCodeSnippet('');
          setQuizQuestion('');
          setOpt1('');
          setOpt2('');
          setOpt3('');
          setOpt4('');
          navigation.navigate('Akış');
        },
      },
      {
        text: 'Yeni Kart Ekle',
        onPress: () => {
          setFront('');
          setBack('');
          setCodeSnippet('');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Yeni Kart Oluştur</Text>
        <Text style={styles.subtitle}>Ders notlarınızdan veya ilginç bilgilerden kart üretin</Text>

        {/* Feed Type Switcher */}
        <Text style={styles.label}>Akış Türü</Text>
        <View style={styles.typeSelectorRow}>
          <TouchableOpacity
            style={[styles.typeBtn, feedType === 'study' && styles.typeBtnActive]}
            onPress={() => setFeedType('study')}
          >
            <Ionicons
              name="school"
              size={18}
              color={feedType === 'study' ? '#FFFFFF' : THEME.colors.textMuted}
            />
            <Text style={[styles.typeBtnText, feedType === 'study' && styles.typeBtnTextActive]}>
              Ders Kartı
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, feedType === 'general_knowledge' && styles.typeBtnActive]}
            onPress={() => setFeedType('general_knowledge')}
          >
            <Ionicons
              name="sparkles"
              size={18}
              color={feedType === 'general_knowledge' ? '#FFFFFF' : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.typeBtnText,
                feedType === 'general_knowledge' && styles.typeBtnTextActive,
              ]}
            >
              Genel Kültür (Trivia)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Deck Selector */}
        <Text style={styles.label}>Bağlı Olduğu Deste</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deckScroll}>
          {decks.map(deck => (
            <TouchableOpacity
              key={deck.id}
              style={[
                styles.deckChip,
                selectedDeckId === deck.id && styles.deckChipActive,
              ]}
              onPress={() => setSelectedDeckId(deck.id)}
            >
              <Text
                style={[
                  styles.deckChipText,
                  selectedDeckId === deck.id && styles.deckChipTextActive,
                ]}
              >
                {deck.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Topic Tag */}
        <Text style={styles.label}>Konu / Etiket</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: Algoritmalar, Uzay, Biyoloji"
          placeholderTextColor={THEME.colors.textMuted}
          value={topic}
          onChangeText={setTopic}
        />

        {/* Front Side */}
        <Text style={styles.label}>Ön Yüz (Soru veya Kavram) *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Öğrenmek veya hatırlamak istediğiniz soru/kavram..."
          placeholderTextColor={THEME.colors.textMuted}
          value={front}
          onChangeText={setFront}
          multiline
        />

        {/* Back Side */}
        <Text style={styles.label}>Arka Yüz (Cevap veya Açıklama) *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Kavramın açıklaması, çözümü veya ilginç detay..."
          placeholderTextColor={THEME.colors.textMuted}
          value={back}
          onChangeText={setBack}
          multiline
        />

        {/* Code Snippet (Optional) */}
        <Text style={styles.label}>Kod Bloğu (Opsiyonel)</Text>
        <TextInput
          style={[styles.input, styles.codeArea]}
          placeholder="// Yazılım veya formül kodu..."
          placeholderTextColor={THEME.colors.textMuted}
          value={codeSnippet}
          onChangeText={setCodeSnippet}
          multiline
        />

        {/* Mini Quiz Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Mini Test Sorusunu Ekle</Text>
          <TouchableOpacity
            style={[styles.switch, includeQuiz && styles.switchOn]}
            onPress={() => setIncludeQuiz(!includeQuiz)}
          >
            <View style={[styles.thumb, includeQuiz && styles.thumbOn]} />
          </TouchableOpacity>
        </View>

        {includeQuiz && (
          <View style={styles.quizBox}>
            <Text style={styles.quizBoxTitle}>Mini Test Sorusu & Şıklar</Text>
            <TextInput
              style={styles.input}
              placeholder="Test Sorusu..."
              placeholderTextColor={THEME.colors.textMuted}
              value={quizQuestion}
              onChangeText={setQuizQuestion}
            />

            <TextInput
              style={[styles.input, correctIdx === 0 && styles.inputCorrectBorder]}
              placeholder="Şık 1 (Doğru seçmek için tıkla)"
              placeholderTextColor={THEME.colors.textMuted}
              value={opt1}
              onChangeText={setOpt1}
            />
            <TextInput
              style={[styles.input, correctIdx === 1 && styles.inputCorrectBorder]}
              placeholder="Şık 2"
              placeholderTextColor={THEME.colors.textMuted}
              value={opt2}
              onChangeText={setOpt2}
            />
            <TextInput
              style={[styles.input, correctIdx === 2 && styles.inputCorrectBorder]}
              placeholder="Şık 3 (Opsiyonel)"
              placeholderTextColor={THEME.colors.textMuted}
              value={opt3}
              onChangeText={setOpt3}
            />
            <TextInput
              style={[styles.input, correctIdx === 3 && styles.inputCorrectBorder]}
              placeholder="Şık 4 (Opsiyonel)"
              placeholderTextColor={THEME.colors.textMuted}
              value={opt4}
              onChangeText={setOpt4}
            />

            <Text style={styles.smallHint}>Doğru olan seçeneğin indexi: {correctIdx + 1}. şık</Text>
            <View style={styles.idxButtonsRow}>
              {[0, 1, 2, 3].map(i => (
                <TouchableOpacity
                  key={i}
                  style={[styles.idxBtn, correctIdx === i && styles.idxBtnActive]}
                  onPress={() => setCorrectIdx(i)}
                >
                  <Text style={[styles.idxBtnText, correctIdx === i && styles.idxBtnTextActive]}>
                    Şık {i + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>Kartı Akışa Ekle</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 16,
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 8,
    marginTop: 14,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161B2B',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#26304C',
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  typeBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deckScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  deckChip: {
    backgroundColor: '#161B2B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#26304C',
  },
  deckChipActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#6366F126',
  },
  deckChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  deckChipTextActive: {
    color: '#A5B4FC',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#151928',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#242D45',
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  codeArea: {
    height: 70,
    fontFamily: 'monospace',
    color: '#38BDF8',
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  switch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#334155',
    padding: 3,
  },
  switchOn: {
    backgroundColor: THEME.colors.primary,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  thumbOn: {
    transform: [{ translateX: 20 }],
  },
  quizBox: {
    backgroundColor: '#111522',
    padding: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#2B3450',
    marginTop: 10,
  },
  quizBoxTitle: {
    color: THEME.colors.accentYellow,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputCorrectBorder: {
    borderColor: THEME.colors.success,
  },
  smallHint: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  idxButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  idxBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#1E2538',
    borderRadius: 6,
    alignItems: 'center',
  },
  idxBtnActive: {
    backgroundColor: THEME.colors.success,
  },
  idxBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  idxBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
