import { Injectable } from '@nestjs/common';

interface ProhibitedWordsResult {
  hasProhibitedWords: boolean;
  foundWords: string[];
}

@Injectable()
export class ContentValidator {
  // Prohibited words list - superlatives, discriminatory terms, unverifiable claims
  private readonly prohibitedWordsEn = [
    // Superlatives
    'best',
    'perfect',
    'amazing',
    'incredible',
    'unbelievable',
    'spectacular',
    'magnificent',
    'extraordinary',
    'ultimate',
    'supreme',
    'finest',
    'greatest',
    'most beautiful',
    'most luxurious',
    'world-class',
    'breathtaking',
    // Unverifiable claims
    'guaranteed',
    'promise',
    'definitely',
    'absolutely will',
    'certain to increase',
    'guaranteed returns',
    'risk-free',
    'no risk',
    // Discriminatory/exclusionary
    'exclusive community',
    'select clientele',
    'prestigious residents',
    'elite only',
    // Pressure tactics
    'once in a lifetime',
    'limited time only',
    'act now',
    'last chance',
    'hurry',
    'must sell',
  ];

  private readonly prohibitedWordsAr = [
    // Arabic superlatives
    'أفضل',
    'مثالي',
    'رائع',
    'لا يصدق',
    'مذهل',
    'استثنائي',
    'الأروع',
    'الأفخم',
    // Unverifiable claims in Arabic
    'مضمون',
    'وعد',
    'بالتأكيد',
    'عوائد مضمونة',
    'بدون مخاطر',
  ];

  /**
   * Check for prohibited words
   */
  checkProhibitedWords(
    text: string,
    language: 'en' | 'ar',
  ): ProhibitedWordsResult {
    const prohibitedList =
      language === 'en' ? this.prohibitedWordsEn : this.prohibitedWordsAr;
    const foundWords: string[] = [];

    const lowerText = text.toLowerCase();

    for (const word of prohibitedList) {
      if (lowerText.includes(word.toLowerCase())) {
        foundWords.push(word);
      }
    }

    return {
      hasProhibitedWords: foundWords.length > 0,
      foundWords,
    };
  }

  /**
   * Calculate reading level using Flesch-Kincaid approximation
   * Returns grade level (8-10 is ideal for real estate)
   */
  calculateReadingLevel(text: string): number {
    // Remove punctuation for word counting
    const cleanText = text.replace(/[^\w\s]/g, ' ');

    // Count sentences (approximate)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;

    // Count words
    const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;

    // Count syllables (approximation for English)
    let syllableCount = 0;
    for (const word of words) {
      syllableCount += this.countSyllables(word);
    }

    // Flesch-Kincaid Grade Level formula
    // 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = syllableCount / wordCount;

    const gradeLevel =
      0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

    return Math.max(0, Math.round(gradeLevel * 10) / 10);
  }

  /**
   * Approximate syllable counting for English words
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase().trim();
    if (word.length <= 3) return 1;

    // Remove silent 'e' at end
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]{1,2}/g);
    const syllables = vowelGroups ? vowelGroups.length : 1;

    return syllables;
  }

  /**
   * Check if Trakheesi permit number is present
   */
  checkTrakheesiPresence(text: string): boolean {
    // Check for English format: "Permit Number: 123..."
    const enPattern = /Permit Number:\s*\d+/i;
    // Check for Arabic format: "رقم التصريح: 123..."
    const arPattern = /رقم التصريح:\s*\d+/;

    return enPattern.test(text) || arPattern.test(text);
  }

  /**
   * Validate description length (150-250 words)
   */
  validateLength(text: string): { valid: boolean; wordCount: number } {
    // Remove Trakheesi line for word count
    const textWithoutPermit = text.replace(
      /\n\n(?:Permit Number:|رقم التصريح:).*$/,
      '',
    );
    const wordsWithoutPermit = textWithoutPermit
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const actualWordCount = wordsWithoutPermit.length;

    return {
      valid: actualWordCount >= 150 && actualWordCount <= 250,
      wordCount: actualWordCount,
    };
  }
}
