export const arabicAnalyzer = {
  type: 'custom',
  tokenizer: 'standard',
  filter: [
    'lowercase',
    'decimal_digit',
    'arabic_normalization',
    'arabic_stemmer',
    'arabic_stop',
  ],
};

export const arabicStopFilter = {
  type: 'stop',
  stopwords: [
    'في',
    'من',
    'إلى',
    'على',
    'مع',
    'عن',
    'هذا',
    'هذه',
    'ذلك',
    'تلك',
    'التي',
    'الذي',
    'ال',
    'و',
    'أو',
    'لكن',
    'لا',
    'نعم',
    'كان',
    'يكون',
    'هو',
    'هي',
    'هم',
    'هن',
  ],
};

export const arabicStemmerFilter = {
  type: 'stemmer',
  language: 'arabic',
};

export const arabicNormalizationFilter = {
  type: 'arabic_normalization',
};

export const englishAnalyzer = {
  type: 'custom',
  tokenizer: 'standard',
  filter: ['lowercase', 'english_stemmer', 'english_stop'],
};

export const englishStopFilter = {
  type: 'stop',
  stopwords: '_english_',
};

export const englishStemmerFilter = {
  type: 'stemmer',
  language: 'english',
};

export const bilingualAnalyzer = {
  type: 'custom',
  tokenizer: 'standard',
  filter: [
    'lowercase',
    'decimal_digit',
    'arabic_normalization',
    'arabic_stemmer',
    'english_stemmer',
  ],
};

export const autocompleteAnalyzer = {
  type: 'custom',
  tokenizer: 'standard',
  filter: ['lowercase', 'autocomplete_filter'],
};

export const autocompleteFilter = {
  type: 'edge_ngram',
  min_gram: 2,
  max_gram: 20,
};

export const searchAnalyzerSettings = {
  analysis: {
    filter: {
      arabic_stop: arabicStopFilter,
      arabic_stemmer: arabicStemmerFilter,
      arabic_normalization: arabicNormalizationFilter,
      english_stop: englishStopFilter,
      english_stemmer: englishStemmerFilter,
      autocomplete_filter: autocompleteFilter,
    },
    analyzer: {
      arabic: arabicAnalyzer,
      english: englishAnalyzer,
      bilingual: bilingualAnalyzer,
      autocomplete: autocompleteAnalyzer,
    },
  },
};
