export type FeedType = 'study' | 'general_knowledge';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type TriviaTopic = 
  | 'Science'
  | 'History'
  | 'Technology'
  | 'Arts & Culture'
  | 'Geography'
  | 'General Trivia';

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  iconName: string;
  cardCount: number;
  isGeneralKnowledge?: boolean;
  createdAt: number;
}

export interface QuizQuestion {
  id: string;
  cardId: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Card {
  id: string;
  deckId: string;
  type: FeedType;
  topic?: TriviaTopic | string;
  front: string;          // Question, concept, or prompt
  back: string;           // Explanation, answer, or trivia fact
  codeSnippet?: string;   // Optional code block for programming courses
  difficulty: DifficultyLevel;
  repetitionCount: number;
  intervalDays: number;
  nextReviewDate: number; // Unix timestamp in milliseconds
  isBookmarked: boolean;
  quiz?: QuizQuestion;    // Embedded mini-quiz for Active Recall
}

export interface UserProgress {
  streak: number;
  lastStudiedDate: string; // YYYY-MM-DD
  dailyGoal: number;
  todayCompletedCount: number;
  totalCardsReviewed: number;
  xp: number;
  level: number;
}

export interface ReviewAction {
  cardId: string;
  rating: DifficultyLevel;
  timestamp: number;
}
