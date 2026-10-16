import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';
import { Deck } from '../types';
import { THEME } from '../constants/theme';

export const DeckListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'courses' | 'trivia'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isGeneralKnowledge, setIsGeneralKnowledge] = useState(false);

  const loadDecks = useCallback(async () => {
    const loaded = await StorageService.getDecks();
    setDecks(loaded);
  }, []);

  useEffect(() => {
    loadDecks();
    const unsubscribe = navigation.addListener('focus', loadDecks);
    return unsubscribe;
  }, [navigation, loadDecks]);

  const filteredDecks = decks.filter(d => {
    if (activeFilter === 'courses') return !d.isGeneralKnowledge;
    if (activeFilter === 'trivia') return d.isGeneralKnowledge;
    return true;
  });

  const handleCreateDeck = async () => {
    if (!title.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen deste başlığını girin.');
      return;
    }

    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Özel çalışma destesi',
      category: category.trim() || (isGeneralKnowledge ? 'Genel Kültür' : 'Ders'),
      color: isGeneralKnowledge ? '#10B981' : '#6366F1',
      iconName: isGeneralKnowledge ? 'sparkles' : 'book',
      cardCount: 0,
      isGeneralKnowledge,
      createdAt: Date.now(),
    };

    await StorageService.addDeck(newDeck);
    setTitle('');
    setDescription('');
    setCategory('');
    setIsGeneralKnowledge(false);
    setIsModalOpen(false);
    loadDecks();
  };

  const handleSelectDeck = (deck: Deck) => {
    // Navigate to Feed tab with specific deck filter
    navigation.navigate('Akış', { deckId: deck.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Desteler & Konular</Text>
          <Text style={styles.headerSubtitle}>Çalışmak istediğiniz konuyu seçin</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            Tümü ({decks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'courses' && styles.filterChipActive]}
          onPress={() => setActiveFilter('courses')}
        >
          <Text style={[styles.filterText, activeFilter === 'courses' && styles.filterTextActive]}>
            Dersler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'trivia' && styles.filterChipActive]}
          onPress={() => setActiveFilter('trivia')}
        >
          <Text style={[styles.filterText, activeFilter === 'trivia' && styles.filterTextActive]}>
            Genel Kültür
          </Text>
        </TouchableOpacity>
      </View>

      {/* Decks Grid / List */}
      <FlatList
        data={filteredDecks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deckCard}
            onPress={() => handleSelectDeck(item)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: `${item.color}22` }]}>
              <Ionicons
                name={(item.iconName as any) || 'book-outline'}
                size={24}
                color={item.color}
              />
            </View>

            <View style={styles.deckInfo}>
              <View style={styles.tagRow}>
                <Text style={[styles.categoryTag, { color: item.color }]}>
                  {item.category.toUpperCase()}
                </Text>
                {item.isGeneralKnowledge && (
                  <View style={styles.triviaBadge}>
                    <Text style={styles.triviaBadgeText}>Trivia</Text>
                  </View>
                )}
              </View>
              <Text style={styles.deckTitle}>{item.title}</Text>
              <Text style={styles.deckDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>

            <View style={styles.rightSide}>
              <View style={styles.cardCountPill}>
                <Ionicons name="layers-outline" size={14} color={THEME.colors.textMuted} />
                <Text style={styles.cardCountText}>{item.cardCount} kart</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Create Deck Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Deste Oluştur</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Deste Başlığı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Veri Yapıları, Dünya Coğrafyası"
              placeholderTextColor={THEME.colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Açıklama</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Deste hakkında kısa not"
              placeholderTextColor={THEME.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={styles.inputLabel}>Kategori / Ders Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Bilgisayar Mühendisliği, Tarih"
              placeholderTextColor={THEME.colors.textMuted}
              value={category}
              onChangeText={setCategory}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Genel Kültür (Trivia) Destesi mi?</Text>
              <TouchableOpacity
                style={[styles.switchToggle, isGeneralKnowledge && styles.switchToggleOn]}
                onPress={() => setIsGeneralKnowledge(!isGeneralKnowledge)}
              >
                <View
                  style={[
                    styles.switchThumb,
                    isGeneralKnowledge && styles.switchThumbOn,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleCreateDeck}
              activeOpacity={0.8}
            >
              <Text style={styles.createBtnText}>Desteyi Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: '#161926',
    borderWidth: 1,
    borderColor: '#242B42',
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: THEME.spacing.md,
    gap: 12,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deckInfo: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  triviaBadge: {
    backgroundColor: '#10B98122',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  triviaBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
  },
  deckTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  deckDescription: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  rightSide: {
    alignItems: 'flex-end',
    marginLeft: 8,
    gap: 8,
  },
  cardCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2338',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cardCountText: {
    fontSize: 11,
    color: THEME.colors.textLight,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000B3',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.cardBackground,
    borderTopLeftRadius: THEME.borderRadius.lg,
    borderTopRightRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1A2033',
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#293352',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: THEME.colors.textLight,
    fontWeight: '600',
  },
  switchToggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#334155',
    padding: 3,
  },
  switchToggleOn: {
    backgroundColor: THEME.colors.success,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbOn: {
    transform: [{ translateX: 22 }],
  },
  createBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
