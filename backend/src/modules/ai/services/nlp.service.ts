import { Injectable, Logger } from '@nestjs/common';
import { AnthropicClient } from '../clients/anthropic.client';
import { ContentValidator } from '../utils/content-validator';

interface PropertyData {
  type: string;
  beds?: number;
  baths?: number;
  area: number;
  community: string;
  amenities?: string[];
  price: number;
  title?: string;
  features?: string[];
}

interface DescriptionResult {
  description: string;
  toxicityFlag: boolean;
  readingLevel: number;
  warnings: string[];
}

interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface BulkGenerationResult {
  propertyId: string;
  description: string;
  success: boolean;
  error?: string;
}

type Tone = 'professional' | 'luxury' | 'family_friendly' | 'investment';
type Language = 'en' | 'ar';

@Injectable()
export class NLPService {
  private readonly logger = new Logger(NLPService.name);

  constructor(
    private readonly anthropicClient: AnthropicClient,
    private readonly contentValidator: ContentValidator,
  ) {}

  /**
   * Generate listing description using Claude API
   */
  async generateListingDescription(
    propertyData: PropertyData,
    trakheesiNumber: string,
    language: Language = 'en',
    tone: Tone = 'professional',
  ): Promise<DescriptionResult> {
    this.logger.log(
      `Generating ${language} description for property in ${propertyData.community}`,
    );

    // Build structured prompt
    const prompt = this.buildDescriptionPrompt(
      propertyData,
      language,
      tone,
    );

    // Call Claude API
    const rawDescription = await this.anthropicClient.callClaude(
      prompt,
      language,
    );

    // Inject Trakheesi number at end
    const trakheesiSuffix = language === 'en'
      ? `\n\nPermit Number: ${trakheesiNumber}`
      : `\n\nرقم التصريح: ${trakheesiNumber}`;

    const description = rawDescription.trim() + trakheesiSuffix;

    // Validate content
    const validationResult = await this.validateContent(description, language);

    return {
      description,
      toxicityFlag: validationResult.toxicityFlag,
      readingLevel: validationResult.readingLevel,
      warnings: validationResult.warnings,
    };
  }

  /**
   * Build structured prompt for Claude API
   */
  private buildDescriptionPrompt(
    property: PropertyData,
    language: Language,
    tone: Tone,
  ): string {
    const toneInstructions = {
      professional: 'Use professional, factual language. Focus on key features and location benefits.',
      luxury: 'Use elegant, sophisticated language. Emphasize exclusivity, premium finishes, and lifestyle.',
      family_friendly: 'Use warm, welcoming language. Highlight safety, space, community amenities, and schools.',
      investment: 'Use data-driven language. Focus on ROI potential, rental yields, and market positioning.',
    };

    const languageInstructions = language === 'en'
      ? 'Write in English.'
      : 'Write in Arabic. Use proper right-to-left formatting and formal Arabic.';

    const bedroomText = property.beds
      ? language === 'en'
        ? `${property.beds}-bedroom`
        : `${property.beds} غرف نوم`
      : language === 'en'
      ? 'studio'
      : 'استوديو';

    const propertyTypeText = language === 'en'
      ? property.type
      : this.translatePropertyType(property.type);

    const prompt = `You are a professional Dubai real estate copywriter. Generate a compelling property listing description.

PROPERTY DETAILS:
- Type: ${propertyTypeText}
- Bedrooms: ${bedroomText}
${property.baths ? `- Bathrooms: ${property.baths}` : ''}
- Area: ${property.area} sq ft
- Community: ${property.community}
- Price: AED ${property.price.toLocaleString()}
${property.amenities?.length ? `- Amenities: ${property.amenities.join(', ')}` : ''}
${property.features?.length ? `- Features: ${property.features.join(', ')}` : ''}

WRITING GUIDELINES:
- Length: 150-250 words
- Tone: ${toneInstructions[tone]}
- ${languageInstructions}
- Highlight location advantages and nearby landmarks
- Include lifestyle benefits
- Be factual - no superlatives (best, perfect, amazing)
- No discriminatory language
- No unverifiable claims
- Focus on Dubai-specific selling points

DO NOT include:
- Permit numbers (will be added separately)
- Contact information
- Pricing negotiation language
- Superlative claims

Generate the description now:`;

    return prompt;
  }

  /**
   * Validate content for toxicity and reading level
   */
  async validateContent(
    text: string,
    language: Language,
  ): Promise<{
    toxicityFlag: boolean;
    readingLevel: number;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Check prohibited words
    const prohibitedCheck = this.contentValidator.checkProhibitedWords(
      text,
      language,
    );
    if (prohibitedCheck.hasProhibitedWords) {
      warnings.push(
        `Contains prohibited words: ${prohibitedCheck.foundWords.join(', ')}`,
      );
    }

    // Calculate reading level (Flesch-Kincaid for English)
    const readingLevel =
      language === 'en'
        ? this.contentValidator.calculateReadingLevel(text)
        : 0; // Arabic reading level calculation not implemented

    // Check reading level
    if (language === 'en' && readingLevel > 12) {
      warnings.push(
        `Reading level too high: ${readingLevel.toFixed(1)} (target: 8-10)`,
      );
    }

    // Check Trakheesi presence
    const hasTrakheesi = this.contentValidator.checkTrakheesiPresence(text);
    if (!hasTrakheesi) {
      warnings.push('Trakheesi permit number not found');
    }

    return {
      toxicityFlag: prohibitedCheck.hasProhibitedWords,
      readingLevel,
      warnings,
    };
  }

  /**
   * Translate description to target language
   */
  async translateDescription(
    text: string,
    targetLanguage: Language,
  ): Promise<TranslationResult> {
    this.logger.log(`Translating to ${targetLanguage}`);

    // Detect source language
    const sourceLanguage: Language = text.match(/[\u0600-\u06FF]/)
      ? 'ar'
      : 'en';

    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        sourceLanguage,
        targetLanguage,
      };
    }

    // Extract Trakheesi number if present
    const trakheesiMatch = text.match(
      /(?:Permit Number:|رقم التصريح:)\s*(\d+)/,
    );
    const trakheesiNumber = trakheesiMatch ? trakheesiMatch[1] : null;

    // Remove Trakheesi from source text
    const textWithoutTrakheesi = trakheesiNumber
      ? text.replace(/\n\n(?:Permit Number:|رقم التصريح:).*$/, '')
      : text;

    const translationPrompt = `Translate the following Dubai real estate property description to ${targetLanguage === 'en' ? 'English' : 'Arabic'}. Maintain the tone and style.

Text to translate:
${textWithoutTrakheesi}

Translation:`;

    const translatedText = await this.anthropicClient.callClaude(
      translationPrompt,
      targetLanguage,
    );

    // Re-add Trakheesi number in target language
    const finalTranslation = trakheesiNumber
      ? targetLanguage === 'en'
        ? `${translatedText.trim()}\n\nPermit Number: ${trakheesiNumber}`
        : `${translatedText.trim()}\n\nرقم التصريح: ${trakheesiNumber}`
      : translatedText.trim();

    return {
      translatedText: finalTranslation,
      sourceLanguage,
      targetLanguage,
    };
  }

  /**
   * Generate descriptions for multiple properties in bulk
   */
  async generateBulkDescriptions(
    properties: Array<{
      propertyId: string;
      propertyData: PropertyData;
      trakheesiNumber: string;
    }>,
    language: Language = 'en',
    tone: Tone = 'professional',
  ): Promise<BulkGenerationResult[]> {
    this.logger.log(`Bulk generating for ${properties.length} properties`);

    const results: BulkGenerationResult[] = [];
    const batchSize = 5;

    // Process in batches of 5
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);

      const batchPromises = batch.map(async (item) => {
        try {
          const result = await this.generateListingDescription(
            item.propertyData,
            item.trakheesiNumber,
            language,
            tone,
          );

          return {
            propertyId: item.propertyId,
            description: result.description,
            success: true,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to generate for ${item.propertyId}: ${errorMessage}`,
          );
          return {
            propertyId: item.propertyId,
            description: '',
            success: false,
            error: errorMessage,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting delay between batches
      if (i + batchSize < properties.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Translate property type to Arabic
   */
  private translatePropertyType(type: string): string {
    const translations: Record<string, string> = {
      apartment: 'شقة',
      villa: 'فيلا',
      townhouse: 'تاون هاوس',
      penthouse: 'بنتهاوس',
      studio: 'استوديو',
      duplex: 'دوبلكس',
      'full floor': 'طابق كامل',
    };

    return translations[type.toLowerCase()] || type;
  }
}
