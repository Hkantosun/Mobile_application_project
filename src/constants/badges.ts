import { Card, Deck, UserProgress } from '../types';

export interface EvaluatedBadge {
  id: string;
  title: string;
  desc: string;
  celebrationMsg: string;
  icon:
    | 'flash'
    | 'trending-up'
    | 'checkmark-done-circle'
    | 'document-text'
    | 'bookmark'
    | 'flame'
    | 'trophy'
    | 'ribbon';
  unlocked: boolean;
  current: number;
  target: number;
}

export function evaluateBadges(
  progress: UserProgress,
  cards: Card[],
  decks: Deck[]
): EvaluatedBadge[] {
  const reviewed = progress.totalCardsReviewed || 0;
  const todayCount = progress.todayCompletedCount || 0;
  const dailyGoal = Math.max(1, progress.dailyGoal || 15);
  const streak = progress.streak || 0;
  const xp = progress.xp || 0;
  const deckCount = decks.length;
  const bookmarkedCount = cards.filter(c => c.isBookmarked).length;
  const masteredCount = cards.filter(c => c.repetitionCount >= 2).length;

  return [
    {
      id: 'first_step',
      title: 'İlk Kıvılcım',
      desc: 'İlk kartını çalış',
      celebrationMsg: 'Öğrenme yolculuğunun ilk adımını attın! Harika bir başlangıç.',
      icon: 'flash',
      unlocked: reviewed >= 1,
      current: Math.min(reviewed, 1),
      target: 1,
    },
    {
      id: 'ten_cards',
      title: 'Hız Kazanan',
      desc: '10 kart tamamla',
      celebrationMsg: 'Tam 10 kartı başarıyla tamamladın! Temponu koru.',
      icon: 'trending-up',
      unlocked: reviewed >= 10,
      current: Math.min(reviewed, 10),
      target: 10,
    },
    {
      id: 'daily_goal',
      title: 'Günün Şampiyonu',
      desc: 'Günlük hedefi bitir',
      celebrationMsg: 'Bugünkü öğrenme hedefini %100 tamamladın!',
      icon: 'checkmark-done-circle',
      unlocked: todayCount >= dailyGoal,
      current: Math.min(todayCount, dailyGoal),
      target: dailyGoal,
    },
    {
      id: 'pdf_creator',
      title: 'Akıllı Kütüphane',
      desc: 'İlk PDF desteni üret',
      celebrationMsg: 'Kendi ders notundan yapay zekâ destekli ilk desteni oluşturdun!',
      icon: 'document-text',
      unlocked: deckCount >= 1,
      current: Math.min(deckCount, 1),
      target: 1,
    },
    {
      id: 'collector',
      title: 'Koleksiyoncu',
      desc: '3 kartı kaydet',
      celebrationMsg: 'Önemli bilgileri favorilerine ekleyerek kendi arşivini kuruyorsun.',
      icon: 'bookmark',
      unlocked: bookmarkedCount >= 3,
      current: Math.min(bookmarkedCount, 3),
      target: 3,
    },
    {
      id: 'streak_3',
      title: 'Seri Koruyucu',
      desc: '3 günlük seri yakala',
      celebrationMsg: '3 gün üst üste çalışarak istikrarını kanıtladın!',
      icon: 'flame',
      unlocked: streak >= 3,
      current: Math.min(streak, 3),
      target: 3,
    },
    {
      id: 'xp_250',
      title: 'XP Avcısı',
      desc: '250+ XP kazan',
      celebrationMsg: '250 XP barajını aştın! Bilgin her gün biraz daha büyüyor.',
      icon: 'trophy',
      unlocked: xp >= 250,
      current: Math.min(xp, 250),
      target: 250,
    },
    {
      id: 'master_5',
      title: 'Usta Zihin',
      desc: '5 kartta ustalaş',
      celebrationMsg: '5 farklı kartı tekrar ederek kalıcı hafızana yerleştirdin!',
      icon: 'ribbon',
      unlocked: masteredCount >= 5,
      current: Math.min(masteredCount, 5),
      target: 5,
    },
  ];
}
