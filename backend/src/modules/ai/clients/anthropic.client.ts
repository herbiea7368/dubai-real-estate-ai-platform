import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

@Injectable()
export class AnthropicClient {
  private readonly logger = new Logger(AnthropicClient.name);
  private readonly apiKey: string;
  private readonly model = 'claude-sonnet-4-20250514';
  private readonly maxTokens = 1000;
  private readonly temperature = 0.7;
  private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured');
    }
  }

  /**
   * Call Claude API with retry logic and exponential backoff
   */
  async callClaude(
    prompt: string,
    language: 'en' | 'ar',
    maxRetries = 3,
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Claude API call attempt ${attempt}/${maxRetries}`);

        const messages: AnthropicMessage[] = [
          {
            role: 'user',
            content: prompt,
          },
        ];

        const systemPrompt =
          language === 'ar'
            ? 'You are a professional Dubai real estate copywriter fluent in Arabic. Write compelling, accurate property descriptions in formal Arabic.'
            : 'You are a professional Dubai real estate copywriter. Write compelling, accurate property descriptions in English.';

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            system: systemPrompt,
            messages,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Anthropic API error (${response.status}): ${errorText}`,
          );
        }

        const data: AnthropicResponse = await response.json();

        if (!data.content || data.content.length === 0) {
          throw new Error('Empty response from Anthropic API');
        }

        const text = data.content[0].text;

        this.logger.log(
          `Claude API success: ${data.usage.input_tokens} input tokens, ${data.usage.output_tokens} output tokens`,
        );

        return text;
      } catch (error) {
        lastError = error as Error;
        this.logger.error(
          `Claude API call failed (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
    throw new Error(
      `Failed to call Claude API after ${maxRetries} attempts: ${errorMessage}`,
    );
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
