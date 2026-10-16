import { AppSettings, FileMetadata, StockPlatformPreset, PlatformSettings } from '../types';
import { captureVideoFrames, captureVideoPoster, prepareImagePayload, PreparedInlineData } from './imageProcessing';
import {
  sanitizeTitle,
  capTitle,
  sanitizeKeywords,
  analyzeCompliance,
  deriveKeywordsFromText,
} from '../utils/compliance';

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Clean and humanize a filename to use as title
 */
export function humanizeFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  const withSpaces = withoutExt.replace(/[-_]+/g, ' ');
  const collapsed = withSpaces.replace(/\s+/g, ' ');
  return collapsed.trim();
}

/**
 * Key manager to hold keys and rotate between them
 */
export class KeyPool {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor(keys: string[]) {
    this.keys = keys.filter((k) => k && k.trim().length > 0);
  }

  public get available(): boolean {
    return this.keys.length > 0;
  }

  public getKey(): string {
    if (this.keys.length === 0) {
      throw new Error('No API key available');
    }
    const key = this.keys[this.currentIndex % this.keys.length];
    return key;
  }

  public rotate(): string {
    if (this.keys.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }
    return this.getKey();
  }

  public get keyCount(): number {
    return this.keys.length;
  }
}

export const ADOBE_STOCK_PROMPT = `You are an Adobe Stock metadata specialist. Given one or more asset files (images or videos), you produce SEO-optimised titles and keywords that maximise discoverability while strictly following Adobe Stock's content policies.
1 — TITLE WRITING: Analyse each asset's visible content and conceptual meaning, then write a title using the words an Adobe Stock buyer would actually type into the search bar. Framework: Core subject / concept + important action / detail + essential context / style. Keep each title ≤ 200 characters (or the user's specified target title length). Use Title Case. Do not stuff the title with keywords; keep it natural and descriptive.
2 — KEYWORD WRITING: 2.1 Pre-analysis (mandatory) — before generating a single keyword, identify: Main subject, Action, Concept, Setting/context, Style, Buyer intent. 2.2 Keyword Priority System (strict order): Slots 1–3 Primary search concepts; 4–6 Main visible elements; 7–10 Strong differentiators; 11–20 Supporting keywords; 21–35 Secondary discovery keywords; 36–49 Extended discovery. IMPORTANT: Every important concept in the title must appear within the first 10 keywords. 2.3 Quantity: Generate the user's specified target keyword count (default: 15–35 highly relevant keywords if no target count is specified; absolute max 49). Thoroughly cover all visible and conceptual angles to reach the requested count. Soft no-filler guard: if relevance becomes genuinely exhausted, stop at the last relevant keyword (never add junk filler merely to reach a number), but AIM for the requested target count first. 2.4 Ranking: first 10 carry greatest weight — strongest first. Describe visible content AND conceptual meaning. Think like a buyer.
3 — STRICT RULES: DO: think like a buyer; accuracy over quantity; strongest keyword first; title concepts in first 10; multi-word keywords only for meaningful searched concepts; one language consistently; differentiate similar assets. DO NOT: duplicate keywords; singular/plural variations; synonym stuffing; invisible concepts; guess usage; irrelevant background objects; trademarks/brands/artist names/IP; title as keyword phrase; spam.
4 — OUTPUT: JSON {title, description, keywords, category} where category is one of 5 (Environment), 8 (Graphics), 16 (Science), 19 (Technology). Description: 1–2 sentences matching the specified target description length.`;

/**
 * Build the exact prompt for Gemini incorporating the authoritative Adobe Stock system prompt,
 * live user Essential Settings constraints, and multi-frame video visual analysis
 */
export function buildPrompt(
  filename?: string,
  settings?: AppSettings,
  isVideo?: boolean,
  activePreset?: StockPlatformPreset,
  platformSettings?: PlatformSettings,
  frameCount?: number
): string {
  let prompt = ADOBE_STOCK_PROMPT;

  const extras: string[] = [];
  if (filename) {
    extras.push(`Asset filename: "${filename}".`);
  }

  // Authoritative User Target Constraints from Essential Settings
  if (settings) {
    const titleLen = settings.titleLength || 200;
    const descLen = settings.descriptionLength || 200;
    const kwCount = settings.keywordsCount || 35;
    const kwFormat = settings.keywordFormat || 'Single';

    extras.push(
      `USER ESSENTIAL SETTINGS TARGETS (AUTHORITATIVE):`,
      `- Title Length Target: ≤ ${titleLen} characters. Write a natural, commercial stock title in Title Case strictly within this limit.`,
      `- Description Length Target: ≤ ${descLen} characters. Write a clear, factual commercial description strictly within this limit.`,
      `- Keywords Count Target: Generate ${kwCount} relevant keywords. The user's count setting of ${kwCount} keywords is your explicit target. You MUST AIM for ${kwCount} keywords by thoroughly exploring all facets of the asset (core subject, actions, details, props, setting, lighting, perspective, mood, and commercial concepts). Soft no-filler rule: if relevance genuinely runs out before reaching ${kwCount}, stop at the last relevant keyword (never pad with meaningless generic filler), but explore all relevant visual and conceptual angles to reach ${kwCount} keywords first.`,
      `- Keyword Format: ${
        kwFormat === 'Single'
          ? 'Single-word keywords preferred where natural.'
          : kwFormat === 'Double'
          ? 'Two-word compound keyword phrases preferred where meaningful.'
          : 'Auto (mix of single-word and meaningful multi-word keyword phrases).'
      }`
    );
  }

  if (isVideo) {
    const frameInfo =
      frameCount === 1
        ? '1 representative frame (all-black video clip fallback)'
        : frameCount && frameCount > 0
        ? `${frameCount} sequential representative frames`
        : 'multiple representative chronological frames';
    extras.push(
      `Asset media type: Video footage clip (${frameInfo} provided as chronological image parts).`,
      `VIDEO MULTI-FRAME ANALYSIS INSTRUCTIONS:`,
      `You are analyzing multiple representative chronological frames extracted across the video clip's full duration (covering start, progressive action, climax, and ending). Analyze the actual visual content and motion ACROSS ALL frames:`,
      `1. Action & Motion: Identify what is happening throughout the sequence — continuous physical actions, movement of subjects/vehicles/elements across time, camera dynamics (e.g., aerial drone, tracking shot, panning, zoom, time-lapse, slow motion), and scene transitions.`,
      `2. Subject & People: Accurately identify who or what is featured (e.g., medical specialist, golden retriever, industrial welder, container ship, software engineers) and their interactions.`,
      `3. Setting & Environment: Describe visible background, indoor/outdoor lighting, architecture, natural scenery, weather, time of day, atmosphere, and real-world environment.`,
      `4. Objects & Props: Identify key tangible elements, tools, machinery, garments, and technology visible across the frames.`,
      `5. Adobe Stock Title & Keywords Rules: Synthesize the full visual story across all frames into a compelling commercial stock title (Title Case, matching target title length) that stock buyers actually search for. Generate the requested target count of highly relevant keywords strictly ordered by priority (slots 1–3 primary concepts, 4–6 main visible elements/actions, 7–10 differentiators, 11–20 supporting, 21–35 secondary discovery, 36–49 extended discovery). Aim for the requested target keyword count; do not add filler or duplicate tags.`,
      `6. Real Visual Content Focus: If any frame is black, blank, or an intro/outro slate/fade, completely ignore the black screen and describe exclusively the actual visual subject, actions, people, props, and scene in the footage.`
    );
  }
  // Video metadata must NEVER come from filename only
  if (settings?.filenameOnlyMode && !isVideo) {
    extras.push(`Filename-only mode: Deduce scene and metadata entirely from filename "${filename}".`);
  }
  if (settings?.silhouetteMode) {
    extras.push(`Asset visual style: Silhouette contour vector.`);
  }
  if (settings?.includeKeywords && settings.includeKeywords.length > 0) {
    extras.push(`Must-include keywords: ${JSON.stringify(settings.includeKeywords)}.`);
  }
  if (settings?.excludeKeywords && settings.excludeKeywords.length > 0) {
    extras.push(`Must-exclude keywords: ${JSON.stringify(settings.excludeKeywords)}.`);
  }

  if (extras.length > 0) {
    prompt += `\n\nAsset Context:\n${extras.join('\n')}`;
  }

  return prompt;
}

/**
 * Fallback regex extractor for broken or partial JSON
 */
function extractFieldsViaRegex(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const titleMatch = text.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
  if (titleMatch) result.title = titleMatch[1];

  const descMatch = text.match(/"description"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
  if (descMatch) result.description = descMatch[1];

  const catMatch = text.match(/"category"\s*:\s*(\d+|"[^"]*")/i);
  if (catMatch) result.category = catMatch[1];

  const kwMatch = text.match(/"(?:keywords|tags|tag_list|keyword_list|keywords_list)"\s*:\s*(\[[^\]]*\]|"[^"]*")/i);
  if (kwMatch) {
    try {
      result.keywords = JSON.parse(kwMatch[1]);
    } catch {
      result.keywords = kwMatch[1];
    }
  }
  return result;
}

/**
 * Defensive JSON parser that strips markdown fences, fixes trailing commas,
 * normalizes array/string/object keywords, handles alternate field names,
 * and falls back to re-deriving keywords from title and description.
 */
export function parseDefensiveJson(rawText: string, fallbackTitle?: string): FileMetadata {
  let cleaned = rawText.trim();

  // Strip markdown fences (both start, end, and internal fences)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/```(?:json)?/gi, '');
  cleaned = cleaned.replace(/```/g, '');
  cleaned = cleaned.trim();

  // Find first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Sanitize trailing commas and non-printable control characters
    try {
      const sanitized = cleaned
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
      parsed = JSON.parse(sanitized);
    } catch {
      // Regex extraction fallback if JSON parsing still fails
      parsed = extractFieldsViaRegex(cleaned);
    }
  }

  const obj = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;

  const title = typeof obj.title === 'string'
    ? obj.title.trim()
    : typeof obj.Title === 'string'
    ? obj.Title.trim()
    : fallbackTitle ? humanizeFilename(fallbackTitle) : '';

  const description = typeof obj.description === 'string'
    ? obj.description.trim()
    : typeof obj.Description === 'string'
    ? obj.Description.trim()
    : '';

  // Accept alternate field names ("keywords", "tags", "tag_list", "keyword_list", "keywords_list")
  const rawKeywordsField =
    obj.keywords ??
    obj.Keywords ??
    obj.tags ??
    obj.Tags ??
    obj.tag_list ??
    obj.Tag_List ??
    obj.tags_list ??
    obj.Tags_List ??
    obj.keyword_list ??
    obj.Keyword_List ??
    obj.keywords_list ??
    obj.Keywords_List ??
    obj.keywordList ??
    obj.keywordsList ??
    obj.key_words ??
    obj.tagList;

  let rawList: string[] = [];

  if (Array.isArray(rawKeywordsField)) {
    for (const item of rawKeywordsField) {
      if (typeof item === 'string') {
        const subParts = item.split(/[,;\n\r\t]+/);
        for (const sp of subParts) {
          const trimmed = sp.trim();
          if (trimmed) rawList.push(trimmed);
        }
      } else if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const val = rec.keyword ?? rec.tag ?? rec.name ?? rec.word ?? Object.values(rec)[0];
        if (typeof val === 'string' && val.trim()) {
          rawList.push(val.trim());
        }
      } else if (item !== null && item !== undefined) {
        const str = String(item).trim();
        if (str) rawList.push(str);
      }
    }
  } else if (typeof rawKeywordsField === 'string') {
    // Comma / newline / semicolon / pipe separated string
    const parts = rawKeywordsField.split(/[,;\n\r|]+/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed) rawList.push(trimmed);
    }
  } else if (rawKeywordsField && typeof rawKeywordsField === 'object') {
    for (const val of Object.values(rawKeywordsField as Record<string, unknown>)) {
      if (typeof val === 'string' && val.trim()) {
        rawList.push(val.trim());
      }
    }
  }

  // Trim whitespace, drop empty strings, dedupe case-insensitively
  const seenKw = new Set<string>();
  const keywords: string[] = [];
  for (const rawKw of rawList) {
    const cleanedKw = rawKw
      .replace(/^[\s\d\-•*.)]+\s*/, '')
      .replace(/["'“”‘’`]/g, '')
      .trim();
    const lower = cleanedKw.toLowerCase();
    if (lower && !seenKw.has(lower)) {
      seenKw.add(lower);
      keywords.push(cleanedKw);
    }
  }

  // Fallback: If keywords are still empty after parsing, re-derive keywords from title + description
  if (keywords.length === 0 && (title || description)) {
    console.log('[StockMeta AI] Keywords empty after parsing, re-deriving from title + description...');
    const derived = deriveKeywordsFromText(title, description);
    for (const d of derived) {
      const lower = d.toLowerCase();
      if (!seenKw.has(lower)) {
        seenKw.add(lower);
        keywords.push(d);
      }
    }
  }

  let category: number | string | undefined = undefined;
  if (obj.category !== undefined && obj.category !== null) {
    const catNum = Number(obj.category);
    category = !isNaN(catNum) ? catNum : String(obj.category).trim();
  }

  if (!title && !description && keywords.length === 0) {
    throw new Error('Received empty metadata fields from AI');
  }

  return { title, description, keywords, category };
}

export function postProcessMetadata(
  filename: string,
  rawMeta: FileMetadata,
  settings: AppSettings,
  activePreset?: StockPlatformPreset,
  platformSettings?: PlatformSettings
): FileMetadata {
  let title = rawMeta.title || '';
  let description = rawMeta.description || '';

  // 1. Filename as Title override
  if (settings.filenameAsTitle) {
    title = humanizeFilename(filename);
  }

  // Sanitize title via compliance engine (strip quotes, tags, spam words, trailing dots)
  title = sanitizeTitle(title);
  if (!title) {
    title = sanitizeTitle(humanizeFilename(filename));
  }
  title = capTitle(title, settings.titleLength || 200);

  // Sanitize description
  description = sanitizeTitle(description);
  const maxDesc = settings.descriptionLength || 200;
  if (description.length > maxDesc) {
    description = capTitle(description, maxDesc);
  }

  // Check platform-specific flags
  const isEditorial = Boolean(
    (activePreset === 'iStock' && platformSettings?.istock.editorial) ||
    (activePreset === 'Pond5' && platformSettings?.pond5.editorial) ||
    (activePreset === 'Depositphotos' && platformSettings?.depositphotos.editorial)
  );

  const isFreepikAi = Boolean(
    activePreset === 'Freepik' && platformSettings?.freepik.aiGenerated
  );

  // Anti-filler discipline: absolute max 49, no padding or minimum forcing
  const maxCountAllowed = Math.min(49, settings.keywordsCount || 49);

  // Ensure rawMeta has keywords; if empty, re-derive from title and description
  let rawKeywords = rawMeta.keywords || [];
  if (rawKeywords.length === 0 && (title || description)) {
    rawKeywords = deriveKeywordsFromText(title, description);
  }

  // Sanitize and rank keywords via compliance engine (spam/trademark scrub, deduping)
  let finalKeywords = sanitizeKeywords(rawKeywords, {
    include: settings.includeKeywords,
    exclude: settings.excludeKeywords,
    keywordFormat: settings.keywordFormat,
    aiGenerated: isFreepikAi,
    maxCount: maxCountAllowed,
    allowTrademarks: isEditorial,
    title,
    description,
  });

  // Guarantee non-empty list if title or description exists (15-35, no filler)
  if (finalKeywords.length === 0 && (title || description)) {
    const fallbackList = deriveKeywordsFromText(title, description);
    finalKeywords = sanitizeKeywords(fallbackList, {
      include: settings.includeKeywords,
      exclude: settings.excludeKeywords,
      keywordFormat: settings.keywordFormat,
      aiGenerated: isFreepikAi,
      maxCount: maxCountAllowed,
      allowTrademarks: isEditorial,
      title,
      description,
    });
  }

  const compliance = analyzeCompliance(title, finalKeywords, { allowTrademarks: isEditorial });

  return {
    title,
    description,
    keywords: finalKeywords,
    category: rawMeta.category,
    complianceScore: compliance.score,
    complianceWarnings: compliance.warnings,
  };
}

/**
 * Safe fetch with hard timeout that NEVER hangs even if _aistudio-iframe.js
 * bootstrapChannel never resolves
 */
function safeFetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Direct fetch timed out after ${timeoutMs}ms (iframe bootstrap unavailable)`));
      }
    }, timeoutMs);

    window.fetch(url, options)
      .then((res) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(res);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      });
  });
}

/**
 * Robust POST JSON via XMLHttpRequest that bypasses _aistudio-iframe.js
 * monkey-patched window.fetch completely
 */
function postJsonViaXhr<T = unknown>(
  url: string,
  body: unknown,
  timeoutMs = 35000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = timeoutMs;

    console.log(`[StockMeta AI Proxy] Initiating POST ${url} via XHR...`);

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      console.log(`[StockMeta AI Proxy] ${url} responded with HTTP status: ${xhr.status}`);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as T;
          resolve(parsed);
        } catch {
          reject(
            new Error(
              `Failed to parse response JSON from ${url}: ${xhr.responseText.slice(0, 100)}`
            )
          );
        }
      } else {
        let errMessage = `HTTP ${xhr.status}`;
        try {
          const errJson = JSON.parse(xhr.responseText);
          if (errJson?.error) errMessage = errJson.error;
        } catch {
          if (xhr.responseText) errMessage = xhr.responseText.slice(0, 150);
        }
        reject(new Error(`Backend proxy error (${xhr.status}): ${errMessage}`));
      }
    };

    xhr.onerror = () => {
      if (settled) return;
      settled = true;
      console.warn(`[StockMeta AI Proxy] Network error on ${url}`);
      reject(new Error(`Network error calling ${url}`));
    };

    xhr.ontimeout = () => {
      if (settled) return;
      settled = true;
      console.warn(`[StockMeta AI Proxy] Request to ${url} timed out after ${timeoutMs}ms`);
      reject(new Error(`Request to ${url} timed out after ${timeoutMs}ms`));
    };

    try {
      xhr.send(JSON.stringify(body));
    } catch (e) {
      if (!settled) {
        settled = true;
        reject(e);
      }
    }
  });
}

/**
 * Call the backend server proxy (/api/generate) via XHR
 */
async function callServerProxy(
  model: string,
  prompt: string,
  inlineParts: PreparedInlineData[],
  apiKey: string,
  isVideo?: boolean,
  settings?: AppSettings
): Promise<string> {
  console.log(
    `[StockMeta AI Proxy] Calling /api/generate (model: ${model}, parts: ${
      inlineParts.length
    }, isVideo: ${Boolean(isVideo)}, keyPresent: ${Boolean(apiKey)}, keyLength: ${apiKey ? apiKey.length : 0})`
  );

  const data = await postJsonViaXhr<{ text?: string }>(
    '/api/generate',
    {
      model,
      prompt,
      inlineParts,
      apiKey,
      isVideo,
      settings,
    },
    35000
  );

  if (!data?.text) {
    throw new Error('Empty text returned from backend proxy');
  }
  return data.text;
}

/**
 * Execute Gemini API request with comprehensive instrumentation,
 * key rotation, exponential backoff, and backend proxy fallback
 */
async function callGeminiApi(
  keyPool: KeyPool,
  model: string,
  prompt: string,
  inlineParts: PreparedInlineData[],
  isVideo?: boolean,
  settings?: AppSettings
): Promise<string> {
  const maxRetries = 4;
  const backoffDelays = [1000, 2000, 4000, 8000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentKey = keyPool.available ? keyPool.getKey() : '';
    const isPlaceholder =
      !currentKey ||
      currentKey === 'GEMINI_API_KEY' ||
      currentKey === 'MY_GEMINI_API_KEY';

    console.log(
      `[StockMeta AI] Key verification: present=${Boolean(currentKey)}, length=${
        currentKey ? currentKey.length : 0
      }, isPlaceholder=${isPlaceholder}, poolSize=${keyPool.keyCount}`
    );
    console.log(
      `[StockMeta AI] [Attempt ${attempt + 1}/${maxRetries + 1}] Target model: ${model}, inline parts count: ${
        inlineParts.length
      }, isVideo: ${Boolean(isVideo)}`
    );

    // If opened directly (not in an iframe) and the key is a placeholder,
    // direct Google API call with placeholder is guaranteed to fail.
    // Call server proxy immediately for instant, seamless generation!
    const isDirectWindow = typeof window !== 'undefined' && window.self === window.top;
    if (isDirectWindow && isPlaceholder) {
      console.log(
        '[StockMeta AI] Direct window & placeholder key detected: using backend proxy /api/generate directly...'
      );
      try {
        const text = await callServerProxy(model, prompt, inlineParts, currentKey, isVideo, settings);
        return text;
      } catch (proxyErr) {
        console.warn(`[StockMeta AI] Backend proxy failed on attempt ${attempt + 1}:`, proxyErr);
        if (attempt < maxRetries) {
          keyPool.rotate();
          const delay = backoffDelays[attempt] || 4000;
          console.log(`[StockMeta AI] Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw proxyErr;
      }
    }

    // Direct Google API call attempt with safe race timeout (3500ms)
    // If inside AI Studio iframe with active bootstrap, it resolves in ~1s.
    // If _aistudio-iframe.js hangs on bootstrapChannel, safeFetchWithTimeout
    // rejects at 3500ms and seamlessly falls back to /api/generate via XHR without hanging!
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
    const parts: unknown[] = [{ text: prompt }];
    for (const p of inlineParts) {
      parts.push({
        inlineData: {
          mimeType: p.mime_type,
          data: p.data,
        },
      });
    }

    console.log(
      `[StockMeta AI] Sending fetch request to Google API (model: ${model}) with 3500ms safety timeout...`
    );

    try {
      const response = await safeFetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        },
        3500
      );

      console.log(`[StockMeta AI] Google API fetch response HTTP status: ${response.status}`);

      if (response.ok) {
        const json = await response.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log('[StockMeta AI] Direct fetch successfully returned candidate text!');
          return text;
        }
      } else if (response.status === 429) {
        console.warn(
          `[StockMeta AI] ${model} returned 429 quota exhausted. Trying direct fetch fallback cascade...`
        );
        for (const fbModel of ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite']) {
          const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${fbModel}:generateContent?key=${currentKey}`;
          const fallbackRes = await safeFetchWithTimeout(
            fallbackEndpoint,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  temperature: 0.1,
                  responseMimeType: 'application/json',
                },
              }),
            },
            3500
          ).catch(() => null);

          if (fallbackRes && fallbackRes.ok) {
            const json = await fallbackRes.json();
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              console.log(`[StockMeta AI] Direct fetch fallback to ${fbModel} succeeded!`);
              return text;
            }
          }
        }
      } else {
        const errorText = await response.text();
        console.warn(
          `[StockMeta AI] Direct fetch returned error (${response.status}): ${errorText.slice(0, 120)}`
        );
      }
    } catch (directErr) {
      console.warn(
        `[StockMeta AI] Direct fetch did not succeed (${
          directErr instanceof Error ? directErr.message : String(directErr)
        }). Falling back to backend proxy /api/generate...`
      );
    }

    // If direct fetch didn't return valid text, call server proxy fallback via XHR
    try {
      console.log('[StockMeta AI] Calling server proxy /api/generate fallback via XHR...');
      const text = await callServerProxy(model, prompt, inlineParts, currentKey, isVideo, settings);
      return text;
    } catch (proxyErr) {
      console.error(`[StockMeta AI] Proxy fallback failed on attempt ${attempt + 1}:`, proxyErr);
      if (attempt < maxRetries) {
        keyPool.rotate();
        const delay = backoffDelays[attempt] || 4000;
        console.log(
          `[StockMeta AI] Retrying overall request (attempt ${attempt + 2}) after ${delay}ms backoff...`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw proxyErr;
    }
  }

  throw new Error('Failed to generate metadata after retries. Please check API key quotas.');
}

export async function generateMetadataForFile(
  file: File,
  settings: AppSettings,
  keyPool: KeyPool,
  activePreset?: StockPlatformPreset,
  platformSettings?: PlatformSettings
): Promise<FileMetadata> {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(file.name);
  console.log(`[StockMeta AI] Starting metadata generation for "${file.name}" (isVideo=${isVideo})`);

  let inlineParts: PreparedInlineData[] = [];

  // For video files: Video metadata must NEVER come from filename or a single poster frame,
  // EXCEPT for genuinely all-black videos where all resampling found zero non-black frames
  // (in which case a single poster frame is used so the model can describe the black screen honestly).
  if (isVideo) {
    console.log(`[StockMeta AI] Extracting multiple representative video frames across duration for "${file.name}"...`);
    try {
      inlineParts = await captureVideoFrames(file);
      console.log(`[StockMeta AI] Extracted ${inlineParts.length} video frames across duration for "${file.name}"`);
    } catch (vidErr) {
      console.warn(`[StockMeta AI] Initial video frame capture error:`, vidErr);
    }

    // ALL-BLACK FALLBACK: If after all resampling ZERO non-black frames exist (a genuinely black video),
    // fall back to sending the captureVideoPoster thumbnail frame (even if dark) as a single image part
    // so the model can describe the video honestly, instead of sending black frames or zero frames.
    if (inlineParts.length === 0) {
      console.log(
        `[StockMeta AI] Zero non-black frames found after all resampling for "${file.name}" (genuinely all-black video). Falling back to captureVideoPoster thumbnail frame...`
      );
      try {
        const posterDataUrl = await captureVideoPoster(file);
        if (posterDataUrl && posterDataUrl.includes(',')) {
          const base64 = posterDataUrl.split(',')[1];
          if (base64) {
            inlineParts = [
              {
                mime_type: 'image/jpeg',
                data: base64,
              },
            ];
            console.log(
              `[StockMeta AI] All-black fallback: single poster thumbnail prepared for "${file.name}"`
            );
          }
        }
      } catch (posterErr) {
        console.warn(`[StockMeta AI] Failed to capture all-black poster thumbnail:`, posterErr);
      }
    }

    if (inlineParts.length === 0) {
      throw new Error(
        `Multi-frame video extraction failed for "${file.name}". Video metadata requires visual analysis across multiple frames.`
      );
    }
  } else if (!settings.filenameOnlyMode) {
    // For images, SVGs, etc.
    try {
      console.log(`[StockMeta AI] Preparing image payload for "${file.name}"...`);
      const part = await prepareImagePayload(file, settings.pngBackground, settings.silhouetteMode);
      inlineParts = [part];
    } catch (mediaErr) {
      console.warn(`[StockMeta AI] Media preparation error for "${file.name}", continuing with text:`, mediaErr);
      inlineParts = [];
    }
  }

  // Build the prompt with exact frame count for video multi-frame analysis
  const prompt = buildPrompt(
    file.name,
    settings,
    isVideo,
    activePreset,
    platformSettings,
    inlineParts.length
  );

  console.log(
    `[StockMeta AI] Submitting to Gemini: isVideo=${isVideo}, inlineParts=${inlineParts.length}, model=${settings.model}`
  );

  let rawText = '';
  let parsedMeta: FileMetadata | null = null;

  try {
    rawText = await callGeminiApi(keyPool, settings.model, prompt, inlineParts, isVideo, settings);
    parsedMeta = parseDefensiveJson(rawText);
  } catch (firstErr) {
    console.warn(`[StockMeta AI] First attempt parse/API error for "${file.name}", retrying once:`, firstErr);
    try {
      rawText = await callGeminiApi(keyPool, settings.model, prompt, inlineParts, isVideo, settings);
      parsedMeta = parseDefensiveJson(rawText);
    } catch (secondErr) {
      throw new Error(
        `Gemini Generation Error: ${
          secondErr instanceof Error ? secondErr.message : String(secondErr)
        }`
      );
    }
  }

  return postProcessMetadata(file.name, parsedMeta, settings, activePreset, platformSettings);
}
