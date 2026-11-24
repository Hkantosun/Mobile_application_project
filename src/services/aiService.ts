import { Card, Deck, DifficultyLevel } from '../types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface AIGeneratedCardInput {
  topic: string;
  front: string;
  back: string;
  difficulty: DifficultyLevel;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface AIGeneratedDeckResult {
  deckTitle: string;
  deckDescription: string;
  category: string;
  cards: AIGeneratedCardInput[];
}

export const AIService = {
  getConfiguredApiKey(): string {
    return (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
  },

  /**
   * Analyzes a PDF (base64) or raw lecture note text using Google Gemini Flash
   * and returns structured 4-option active-recall flashcards.
   */
  async generateFlashcardsFromContent(params: {
    fileName?: string;
    pdfBase64?: string;
    textContent?: string;
    questionCount?: number;
  }): Promise<{ deck: Deck; cards: Card[] }> {
    const { fileName, pdfBase64, textContent, questionCount = 6 } = params;
    const apiKey = this.getConfiguredApiKey();

    if (!apiKey) {
      throw new Error(
        'Yapay zekâ anahtarı tanımlı değil. Proje ana dizinindeki .env.local dosyasına EXPO_PUBLIC_GEMINI_API_KEY ekleyin.'
      );
    }

    if (!pdfBase64 && (!textContent || !textContent.trim())) {
      throw new Error('Analiz edilecek bir PDF dosyası veya ders notu metni seçmelisiniz.');
    }

    const promptText = `Sen uzman bir eğitim tasarımcısı ve aktif hatırlama (Active Recall) koçusun.
Verilen ders notunu veya PDF belgesini dikkatlice analiz et ve öğrencinin konuyu derinlemesine kavraması için tam ${questionCount} adet yüksek kaliteli, şıklı mikro-öğrenme kartı üret.

Kurallar:
1. Tüm içerik, sorular, şıklar ve açıklamalar Türkçe (veya belgenin dili Türkçe değilse belgeyle uyumlu Türkçe açıklamalı) olsun.
2. Her kartın mutlaka 4 adet şıkkı ("options") ve 0-3 arasında tek bir doğru cevap indeksi ("correctAnswerIndex") olsun.
3. "front" alanı soruyu net ve merak uyandırıcı şekilde sorsun.
4. "back" alanı konunun özünü ve doğru cevabın mantığını 1-2 cümlede özetlesin.
5. "explanation" alanı seçilen şıkkın neden doğru olduğunu pedagojik olarak açıklasın.
6. "difficulty" yalnızca "easy", "medium" veya "hard" olabilir.
7. Yalnızca aşağıdaki JSON formatında yanıt ver, başka açıklama ekleme:

{
  "deckTitle": "Belgeye uygun kısa deste adı",
  "deckDescription": "Belgenin içeriğini özetleyen 1 cümle",
  "category": "Ders Kategorisi (ör. Biyoloji, Tarih, Hukuk, Ekonomi, Tıp)",
  "cards": [
    {
      "topic": "Alt Konu Başlığı",
      "front": "Soru metni",
      "back": "Özet cevap ve çıkarım",
      "difficulty": "medium",
      "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"],
      "correctAnswerIndex": 0,
      "explanation": "Neden doğru olduğunun kısa açıklaması"
    }
  ]
}`;

    const parts: any[] = [];

    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64,
        },
      });
    }

    if (textContent && textContent.trim()) {
      parts.push({
        text: `Ders Notu İçeriği (${fileName || 'Metin'}):\n\n${textContent.slice(0, 35000)}`,
      });
    }

    parts.push({ text: promptText });

    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    });

    const rawBody = await response.json();

    if (!response.ok) {
      const apiMsg = rawBody?.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini API Hatası: ${apiMsg}`);
    }

    const rawText = rawBody?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Yapay zekâdan geçerli bir yanıt alınamadı.');
    }

    const cleanedJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: AIGeneratedDeckResult;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      throw new Error('Yapay zekâ yanıtı JSON olarak çözümlenemedi. Lütfen tekrar deneyin.');
    }

    if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      throw new Error('Belgeden soru kartı üretilemedi. PDF içeriğinin okunabilir metin içerdiğinden emin olun.');
    }

    const now = Date.now();
    const deckId = `deck-ai-${now}`;
    const cleanFileName = fileName ? fileName.replace(/\.(pdf|txt|md)$/i, '') : 'AI Ders Notu';

    const deck: Deck = {
      id: deckId,
      title: parsed.deckTitle?.trim() || cleanFileName,
      description: parsed.deckDescription?.trim() || 'Yapay zekâ tarafından analiz edilen ders notlarından üretildi.',
      category: parsed.category?.trim() || 'Yapay Zekâ Notu',
      color: '#4EDEA3',
      iconName: 'sparkles',
      cardCount: parsed.cards.length,
      isGeneralKnowledge: false,
      createdAt: now,
    };

    const cards: Card[] = parsed.cards.map((item, idx) => {
      const cardId = `card-ai-${now}-${idx}`;
      const options = Array.isArray(item.options) && item.options.length >= 2
        ? item.options.slice(0, 4)
        : ['Doğru', 'Yanlış', 'Kısmen Doğru', 'İlgisiz'];
      const correctIdx =
        typeof item.correctAnswerIndex === 'number' &&
        item.correctAnswerIndex >= 0 &&
        item.correctAnswerIndex < options.length
          ? item.correctAnswerIndex
          : 0;

      const difficulty: DifficultyLevel =
        item.difficulty === 'easy' || item.difficulty === 'hard' ? item.difficulty : 'medium';

      return {
        id: cardId,
        deckId,
        type: 'study',
        topic: item.topic?.trim() || deck.category,
        front: item.front?.trim() || 'Soru',
        back: item.back?.trim() || options[correctIdx],
        difficulty,
        repetitionCount: 0,
        intervalDays: 1,
        nextReviewDate: now,
        isBookmarked: false,
        quiz: {
          id: `quiz-ai-${now}-${idx}`,
          cardId,
          question: item.front?.trim() || 'Soru',
          options,
          correctAnswerIndex: correctIdx,
          explanation: item.explanation?.trim() || item.back?.trim() || '',
        },
      };
    });

    return { deck, cards };
  },
};
