/**
 * Stock Agency Compliance Engine
 * Enforces strict submission rules across stock platforms (Adobe Stock, Shutterstock,
 * iStock / Getty Images, Freepik, Vecteezy, 123RF, Depositphotos, Pond5, Canva).
 */

export const BANNED_SPAM_WORDS: string[] = [
  'best',
  'top',
  '4k',
  '8k',
  '16k',
  'hd',
  'uhd',
  'full hd',
  'ultra hd',
  'ultra-hd',
  'masterpiece',
  'wallpaper',
  'stock photo',
  'stock image',
  'stock picture',
  'royalty free',
  'royalty-free',
  'isolated on white background',
  'isolated on white',
  'white background',
  'beautiful',
  'amazing',
  'incredible',
  'stunning',
  'gorgeous',
  'wonderful',
  'fantastic',
  'awesome',
  'nice',
  'pretty',
  'lovely',
  'perfect',
  'great',
  'good',
  'excellent',
  'high quality',
  'high-quality',
  'high resolution',
  'high-resolution',
  'photo',
  'picture',
  'image',
  'photograph',
  'background',
  'backdrop',
  'copy space',
  'negative space',
  'mockup',
  'template',
  'banner',
  'poster',
  'closeup',
  'close-up',
  'trending',
  'viral',
  'popular',
  'new',
  'free',
  'download',
  'shutterstock',
  'adobestock',
  'adobe stock',
  'getty',
  'gettyimages',
  'istock',
  'freepik',
  'vecteezy',
  'depositphotos',
  'dreamstime',
  '123rf',
  'alamy',
  'canva',
  'pond5',
  'envato',
  'bigstock',
];

export const PROTECTED_TRADEMARKS: string[] = [
  'Apple',
  'iPhone',
  'iPad',
  'MacBook',
  'AirPods',
  'Samsung',
  'Galaxy',
  'Sony',
  'PlayStation',
  'Nintendo',
  'Switch',
  'Xbox',
  'Microsoft',
  'Microsoft Windows',
  'Google',
  'Android',
  'Pixel',
  'Nike',
  'Adidas',
  'Puma',
  'Reebok',
  'Gucci',
  'Louis Vuitton',
  'Chanel',
  'Prada',
  'Hermes',
  'Disney',
  'Marvel',
  'Pixar',
  'Star Wars',
  'Coca-Cola',
  'Coke',
  'Pepsi',
  'Red Bull',
  'Starbucks',
  "McDonald's",
  'KFC',
  'Tesla',
  'SpaceX',
  'Ferrari',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Porsche',
  'Lamborghini',
  'Toyota',
  'Honda',
  'Ford',
  'Volkswagen',
  'Instagram',
  'Facebook',
  'TikTok',
  'Twitter',
  'YouTube',
  'Netflix',
  'Spotify',
  'Amazon',
  'Prime',
  'ChatGPT',
  'OpenAI',
  'Midjourney',
  'DALL-E',
  'LEGO',
  'Barbie',
  'Hot Wheels',
  'IKEA',
  'Zara',
  'H&M',
  'Uniqlo',
  'Rolex',
  'Cartier',
  'Ray-Ban',
  'Oakley',
  'Canon',
  'Nikon',
  'GoPro',
  'DJI',
  'Bose',
  'JBL',
  'Philips',
  'Panasonic',
  'LG',
  'Huawei',
  'Xiaomi',
  'Lenovo',
  'Dell',
  'HP',
  'Intel',
  'AMD',
  'NVIDIA',
  'Adobe',
  'Photoshop',
  'Heineken',
  'Budweiser',
  'Corona',
  'Marlboro',
  'Kleenex',
  'Band-Aid',
  'Velcro',
  'Post-it',
  'Sharpie',
  'Jeep',
  'Harley-Davidson',
];

// Common English words that can overlap with trademarks but should NEVER be flagged as trademarks
// when used in generic contexts (e.g. architectural "windows", camera "pixel", cosmic "galaxy", "switch", "prime fruit")
export const GENERIC_DICTIONARY_WORDS = new Set([
  'windows',
  'window',
  'switch',
  'switches',
  'prime',
  'galaxy',
  'galaxies',
  'pixel',
  'pixels',
  'apple',
  'apples',
]);

// Common English stopwords to filter when extracting meaningful keywords from title/description
export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'featuring', 'depicting', 'showing', 'contains', 'view', 'close'
]);

// Pre-compiled regex patterns for banned spam words (sorted longest first to match phrases before individual words)
const SORTED_BANNED_WORDS = [...BANNED_SPAM_WORDS].sort((a, b) => b.length - a.length);

const BANNED_WORDS_REGEX = SORTED_BANNED_WORDS.map((w) => {
  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'gi');
});

export const BANNED_WORDS_SET = new Set(BANNED_SPAM_WORDS.map((w) => w.toLowerCase()));
export const PROTECTED_TRADEMARKS_SET = new Set(
  PROTECTED_TRADEMARKS.map((t) => t.toLowerCase()).filter((t) => !GENERIC_DICTIONARY_WORDS.has(t))
);

/**
 * Re-derive keywords from title and description:
 * - Splits into meaningful words and phrases
 * - Drops common stopwords
 * - Normalizes case
 * - Dedupes case-insensitively
 * - Caps at 35 keywords
 */
export function deriveKeywordsFromText(title: string, description: string = ''): string[] {
  const combined = `${title || ''} ${description || ''}`;
  if (!combined.trim()) return [];

  const rawTokens = combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !BANNED_WORDS_SET.has(t));

  const seen = new Set<string>();
  const derived: string[] = [];

  // Extract meaningful 2-word combinations if adjacent in title
  const cleanTitleWords = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (let i = 0; i < cleanTitleWords.length - 1; i++) {
    const w1 = cleanTitleWords[i];
    const w2 = cleanTitleWords[i + 1];
    if (
      w1.length >= 3 &&
      w2.length >= 3 &&
      !STOPWORDS.has(w1) &&
      !STOPWORDS.has(w2) &&
      !BANNED_WORDS_SET.has(w1) &&
      !BANNED_WORDS_SET.has(w2)
    ) {
      const phrase = `${w1} ${w2}`;
      if (!seen.has(phrase)) {
        seen.add(phrase);
        derived.push(phrase);
      }
    }
  }

  // Add individual meaningful words
  for (const token of rawTokens) {
    if (!seen.has(token) && !BANNED_WORDS_SET.has(token)) {
      seen.add(token);
      derived.push(token);
    }
  }

  return derived.slice(0, 35);
}

/**
 * Sanitize a stock asset title:
 * - Strip surrounding quotes and HTML tags/wrappers
 * - Remove trailing period (strictly rejected by Adobe Stock)
 * - Whole-word case-insensitive removal of BANNED_SPAM_WORDS (multi-word first)
 * - Collapse whitespace, capitalize first letter, trim
 */
export function sanitizeTitle(title: string): string {
  if (!title) return '';

  let cleaned = title.trim();

  // Strip surrounding quotes (double, single, curly quotes)
  cleaned = cleaned.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '').trim();

  // Strip HTML tags / wrappers
  cleaned = cleaned.replace(/<[^>]*>/g, '').trim();

  // Strip banned spam words (whole words/phrases)
  for (const regex of BANNED_WORDS_REGEX) {
    cleaned = cleaned.replace(regex, ' ');
  }

  // Remove trailing period / punctuation (Adobe Stock rule)
  cleaned = cleaned.replace(/[.\s]+$/, '').trim();

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Truncate a title to maxChars respecting word boundaries
 */
export function capTitle(title: string, maxChars: number): string {
  if (!title || title.length <= maxChars) {
    return title;
  }

  const truncated = title.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 10) {
    return truncated.substring(0, lastSpace).trim();
  }

  return truncated.trim();
}

export interface SanitizeKeywordsOptions {
  include?: string[];
  exclude?: string[];
  keywordFormat?: string; // 'Single' | 'Double' | 'Auto'
  aiGenerated?: boolean;
  maxCount: number;
  allowTrademarks?: boolean;
  title?: string;
  description?: string;
}

/**
 * Sanitize, filter, format, and rank keywords for stock compliance:
 * - Prepend include keywords first (priority, deduped)
 * - Exclude forbidden user keywords
 * - Remove spam words (4k, hd, beautiful, best, etc.)
 * - Remove protected trademarks (unless allowTrademarks is true for editorial)
 * - Enforce Single vs Double keyword format
 * - Append AI tags if aiGenerated is true
 * - Deduplicate case-insensitively preserving order
 * - Cap to maxCount
 */
export function sanitizeKeywords(
  keywords: string[],
  opts: SanitizeKeywordsOptions
): string[] {
  const {
    include = [],
    exclude = [],
    keywordFormat = 'Single',
    aiGenerated = false,
    maxCount = 45,
    allowTrademarks = false,
    title = '',
    description = '',
  } = opts;

  const excludeSet = new Set(exclude.map((k) => k.trim().toLowerCase()).filter(Boolean));

  // Helper to validate a keyword token against spam and trademark filters
  const isKeywordAllowed = (kw: string): boolean => {
    const lower = kw.toLowerCase().trim();
    if (!lower || lower.length < 2) return false;
    if (excludeSet.has(lower)) return false;
    if (BANNED_WORDS_SET.has(lower)) return false;
    if (!allowTrademarks && PROTECTED_TRADEMARKS_SET.has(lower)) {
      if (!GENERIC_DICTIONARY_WORDS.has(lower)) {
        return false;
      }
    }
    // Check if it's purely digits or non-alphanumeric
    if (!/[a-zA-Z]/.test(lower)) return false;
    return true;
  };

  const processedList: string[] = [];

  for (const raw of keywords) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (keywordFormat === 'Single') {
      // Split on spaces, commas, slashes, hyphens into clean single words
      const parts = trimmed.split(/[\s,/_]+/);
      for (const part of parts) {
        const cleaned = part.replace(/[^a-zA-Z0-9-]/g, '').trim().toLowerCase();
        if (isKeywordAllowed(cleaned)) {
          processedList.push(cleaned);
        }
      }
    } else if (keywordFormat === 'Double') {
      const cleaned = trimmed.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (isKeywordAllowed(cleaned)) {
        processedList.push(cleaned);
      }
    } else {
      // Auto: keep single or compound phrases cleaned
      const cleaned = trimmed.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (isKeywordAllowed(cleaned)) {
        processedList.push(cleaned);
      }
    }
  }

  // Deduplicate preserving ranking order
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const kw of processedList) {
    if (!seen.has(kw)) {
      seen.add(kw);
      deduped.push(kw);
    }
  }

  // Fallback: If after scrubbing, the list is empty (or below 15), derive from title & description
  // Guarantees generation NEVER yields 0 keywords when title/description is available
  if ((deduped.length === 0 || deduped.length < 15) && (title || description)) {
    const derived = deriveKeywordsFromText(title, description);
    for (const d of derived) {
      if (isKeywordAllowed(d)) {
        const lower = d.toLowerCase();
        if (!seen.has(lower) && !excludeSet.has(lower)) {
          seen.add(lower);
          deduped.push(d);
        }
      }
      if (deduped.length >= Math.min(30, maxCount)) break;
    }
  }

  // If AI generated content is enabled (e.g. Freepik AI Generated), ensure official AI tags are present
  if (aiGenerated) {
    const aiTags = ['ai generated', 'generative ai', 'ai concept'];
    for (const tag of aiTags) {
      const lower = tag.toLowerCase();
      if (!seen.has(lower) && !excludeSet.has(lower)) {
        seen.add(lower);
        deduped.push(lower);
      }
    }
  }

  // Prepend include keywords at the very front (guaranteed priority, never sliced off)
  const cleanIncludes = include.map((k) => k.trim().toLowerCase()).filter(Boolean);
  for (let i = cleanIncludes.length - 1; i >= 0; i--) {
    const inc = cleanIncludes[i];
    if (!excludeSet.has(inc)) {
      const existingIdx = deduped.indexOf(inc);
      if (existingIdx !== -1) {
        deduped.splice(existingIdx, 1);
      }
      deduped.unshift(inc);
    }
  }

  // Cap to maxCount
  return deduped.slice(0, maxCount);
}

export interface ComplianceAnalysis {
  score: number;
  warnings: string[];
}

/**
 * Compliance Analysis Engine:
 * Analyzes title and keywords against agency submission rules.
 * Score starts at 100.
 * - Deduct 10 per spam word found in title or keywords
 * - Deduct 15 per trademark found (unless allowTrademarks is true for editorial)
 * - Deduct 10 if title has a trailing period (strictly rejected by Adobe Stock)
 * - Deduct 5 if keywords < 15
 * - Deduct 10 if keywords > 50
 * - Deduct 5 per duplicate keyword
 * Floor score at 0. Return score and human-readable warning strings.
 */
export function analyzeCompliance(
  title: string,
  keywords: string[],
  options?: { allowTrademarks?: boolean }
): ComplianceAnalysis {
  let score = 100;
  const warnings: string[] = [];
  const allowTrademarks = Boolean(options?.allowTrademarks);

  const trimmedTitle = (title || '').trim();

  // 1. Check title trailing period
  if (trimmedTitle.endsWith('.')) {
    score -= 10;
    warnings.push('Title has a trailing period (strictly rejected by Adobe Stock)');
  }

  // 2. Check spam words in title
  const foundTitleSpam = new Set<string>();
  for (const regex of BANNED_WORDS_REGEX) {
    const matches = trimmedTitle.match(regex);
    if (matches) {
      for (const m of matches) {
        foundTitleSpam.add(m.toLowerCase());
      }
    }
  }
  for (const spam of foundTitleSpam) {
    score -= 10;
    warnings.push(`Spam/banned phrase in title: "${spam}"`);
  }

  // 3. Check trademarks in title (word-boundary, case-aware, limited to real brand/IP names)
  if (!allowTrademarks) {
    const foundTitleTrademarks = new Set<string>();
    for (const tm of PROTECTED_TRADEMARKS) {
      const tmLower = tm.toLowerCase();
      // Skip generic dictionary words (e.g. "windows", "switch", "pixel") from standalone matches
      if (GENERIC_DICTIONARY_WORDS.has(tmLower)) {
        continue;
      }
      const tmRegex = new RegExp(`\\b${tm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (tmRegex.test(trimmedTitle)) {
        foundTitleTrademarks.add(tm);
      }
    }

    // Explicit check for real brand name "Microsoft Windows" vs generic building "windows"
    if (
      /\bMicrosoft\s+Windows\b/i.test(trimmedTitle) ||
      /\bWindows\s+(?:11|10|8|7|XP|Vista|Server|OS|Phone)\b/i.test(trimmedTitle)
    ) {
      foundTitleTrademarks.add('Microsoft Windows');
    }

    for (const tm of foundTitleTrademarks) {
      score -= 15;
      warnings.push(`Protected trademark in title: "${tm}"`);
    }
  }

  // 4. Check keyword count limits
  if (keywords.length < 15) {
    score -= 5;
    warnings.push(`Keyword count is below 15 (${keywords.length}/15 recommended minimum)`);
  } else if (keywords.length > 50) {
    score -= 10;
    warnings.push(`Keyword count exceeds 50 (${keywords.length}/50 maximum for most agencies)`);
  }

  // 5. Check duplicate keywords
  const seenKw = new Set<string>();
  const duplicateKw = new Set<string>();
  for (const kw of keywords) {
    const lower = kw.toLowerCase().trim();
    if (!lower) continue;
    if (seenKw.has(lower)) {
      duplicateKw.add(lower);
    } else {
      seenKw.add(lower);
    }
  }
  for (const dup of duplicateKw) {
    score -= 5;
    warnings.push(`Duplicate keyword detected: "${dup}"`);
  }

  // 6. Check spam words in keywords
  const foundKwSpam = new Set<string>();
  for (const kw of keywords) {
    const lower = kw.toLowerCase().trim();
    if (BANNED_WORDS_SET.has(lower)) {
      foundKwSpam.add(lower);
    }
  }
  for (const spam of foundKwSpam) {
    score -= 10;
    warnings.push(`Spam/banned keyword: "${spam}"`);
  }

  // 7. Check trademarks in keywords (word-boundary, case-aware, generic dictionary words exempted)
  if (!allowTrademarks) {
    const foundKwTrademarks = new Set<string>();
    for (const kw of keywords) {
      const lower = kw.toLowerCase().trim();
      // Skip generic dictionary words (e.g. architectural "windows", "switch", "pixel")
      if (GENERIC_DICTIONARY_WORDS.has(lower)) {
        continue;
      }
      if (PROTECTED_TRADEMARKS_SET.has(lower)) {
        foundKwTrademarks.add(kw);
      }
    }
    for (const tm of foundKwTrademarks) {
      score -= 15;
      warnings.push(`Protected trademark in keywords: "${tm}"`);
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    warnings,
  };
}
