import 'dotenv/config';
import express from 'express';
import type { Request, Response as ExpressResponse } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { deriveKeywordsFromText } from './src/utils/compliance';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ADOBE_STOCK_PROMPT = `You are an Adobe Stock metadata specialist. Given one or more asset files (images or videos), you produce SEO-optimised titles and keywords that maximise discoverability while strictly following Adobe Stock's content policies.
1 — TITLE WRITING: Analyse each asset's visible content and conceptual meaning, then write a title using the words an Adobe Stock buyer would actually type into the search bar. Framework: Core subject / concept + important action / detail + essential context / style. Keep each title ≤ 200 characters (or specified target title length). Use Title Case. Do not stuff the title with keywords; keep it natural and descriptive.
2 — KEYWORD WRITING: 2.1 Pre-analysis (mandatory) — before generating a single keyword, identify: Main subject, Action, Concept, Setting/context, Style, Buyer intent. 2.2 Keyword Priority System (strict order): Slots 1–3 Primary search concepts; 4–6 Main visible elements; 7–10 Strong differentiators; 11–20 Supporting keywords; 21–35 Secondary discovery keywords; 36–49 Extended discovery. IMPORTANT: Every important concept in the title must appear within the first 10 keywords. 2.3 Quantity: Generate the user's specified target keyword count (default: 15–35 highly relevant keywords if no target count is specified; absolute max 49). Thoroughly cover all visible and conceptual angles to reach the requested count. Soft no-filler guard: if relevance becomes genuinely exhausted, stop at the last relevant keyword (never add junk filler merely to reach a number), but AIM for the requested target count first. 2.4 Ranking: first 10 carry greatest weight — strongest first. Describe visible content AND conceptual meaning. Think like a buyer.
3 — STRICT RULES: DO: think like a buyer; accuracy over quantity; strongest keyword first; title concepts in first 10; multi-word keywords only for meaningful searched concepts; one language consistently; differentiate similar assets. DO NOT: duplicate keywords; singular/plural variations; synonym stuffing; invisible concepts; guess usage; irrelevant background objects; trademarks/brands/artist names/IP; title as keyword phrase; spam.
4 — OUTPUT: JSON {title, description, keywords, category} where category is one of 5 (Environment), 8 (Graphics), 16 (Science), 19 (Technology). Description: 1–2 sentences matching specified target description length.`;

export const VIDEO_MULTI_FRAME_INSTRUCTIONS = `Asset media type: Video footage clip (sequential representative frames provided as chronological image parts).
VIDEO MULTI-FRAME ANALYSIS INSTRUCTIONS:
You are analyzing multiple representative chronological frames extracted across the video clip's full duration (covering start, progressive action, climax, and ending). Analyze the actual visual content and motion ACROSS ALL frames:
1. Action & Motion: Identify what is happening throughout the sequence — continuous physical actions, movement of subjects/vehicles/elements across time, camera dynamics (e.g., aerial drone, tracking shot, panning, zoom, time-lapse, slow motion), and scene transitions.
2. Subject & People: Accurately identify who or what is featured (e.g., medical specialist, golden retriever, industrial welder, container ship, software engineers) and their interactions.
3. Setting & Environment: Describe visible background, indoor/outdoor lighting, architecture, natural scenery, weather, time of day, atmosphere, and real-world environment.
5. Adobe Stock Title & Keywords Rules: Synthesize the full visual story across all frames into a compelling commercial stock title (Title Case, matching target title length) that stock buyers actually search for. Generate the requested target count of highly relevant keywords strictly ordered by priority (slots 1–3 primary concepts, 4–6 main visible elements/actions, 7–10 differentiators, 11–20 supporting, 21–35 secondary discovery, 36–49 extended discovery). Aim for the requested target keyword count; do not add filler or duplicate tags.
6. Real Visual Content Focus: If any frame is black, blank, or an intro/outro slate/fade, completely ignore the black screen and describe exclusively the actual visual subject, actions, people, props, and scene in the footage.`;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Server-side Gemini API proxy route
  app.post('/api/generate', async (req: Request, res: ExpressResponse) => {
    try {
      const { model, prompt, inlineParts, apiKey, isVideo, settings } = req.body;

      // Select real API key: forwarded user key if valid, or server env var
      let effectiveKey = (apiKey || '').trim();
      const isPlaceholder =
        !effectiveKey ||
        effectiveKey === 'GEMINI_API_KEY' ||
        effectiveKey === 'MY_GEMINI_API_KEY';
      const serverKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();

      if (isPlaceholder) {
        effectiveKey = serverKey;
      }

      const partsCount = Array.isArray(inlineParts) ? inlineParts.length : 0;
      const isMultiFrameVideo = Boolean(isVideo || partsCount > 1);

      console.log(
        `[Server /api/generate] Request received. Model: ${model || 'gemini-3.8-flash'}, parts: ${
          partsCount
        } (${isMultiFrameVideo ? 'video multi-frame analysis' : 'single asset'}), keyPresent: ${Boolean(
          effectiveKey
        )}, keyLength: ${effectiveKey.length}`
      );

      if (!effectiveKey) {
        console.warn('[Server /api/generate] Error: No valid Gemini API key found on server');
        return res.status(400).json({
          error: 'No valid Gemini API key available on server. Please add a key in settings.',
        });
      }

      const targetModel = model || 'gemini-3.8-flash';
      let promptText = (prompt && String(prompt).trim().length > 0) ? String(prompt).trim() : ADOBE_STOCK_PROMPT;

      // If user settings target constraints are supplied and not already in prompt, append them
      if (settings && !promptText.includes('USER ESSENTIAL SETTINGS TARGETS')) {
        const titleLen = settings.titleLength || 200;
        const descLen = settings.descriptionLength || 200;
        const kwCount = settings.keywordsCount || 35;
        promptText += `\n\nUSER ESSENTIAL SETTINGS TARGETS (AUTHORITATIVE):\n- Title Length Target: ≤ ${titleLen} characters\n- Description Length Target: ≤ ${descLen} characters\n- Keywords Count Target: Generate ${kwCount} relevant keywords (AIM for ${kwCount} first; soft no-filler guard).`;
      }

      // Ensure video multi-frame instructions are appended if analyzing a video
      if (isMultiFrameVideo && !promptText.includes('VIDEO MULTI-FRAME ANALYSIS INSTRUCTIONS')) {
        promptText += '\n\n' + VIDEO_MULTI_FRAME_INSTRUCTIONS;
      }

      const parts: unknown[] = [{ text: promptText }];
      if (Array.isArray(inlineParts)) {
        for (const p of inlineParts) {
          if (p?.data) {
            parts.push({
              inlineData: {
                mimeType: p.mime_type || p.mimeType || 'image/jpeg',
                data: p.data,
              },
            });
          }
        }
      }

      const callGoogleApi = async (m: string, keyToUse: string) => {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${keyToUse}`;
        console.log(`[Server /api/generate] Sending fetch request to Google API (model: ${m})...`);
        return fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });
      };

      let response: Response | null = null;
      try {
        response = await callGoogleApi(targetModel, effectiveKey);
        console.log(`[Server /api/generate] Target model ${targetModel} returned status: ${response.status}`);
      } catch (err) {
        console.warn(`[Server /api/generate] Target model call failed:`, err);
      }

      // If quota exhausted (429) or model temporarily unavailable, try fallback cascade
      if (!response || response.status === 429 || !response.ok) {
        const fallbackCandidates = [
          'gemini-3.5-flash',
          'gemini-3.5-flash-lite',
          'gemini-2.5-flash-lite',
        ].filter((m) => m !== targetModel);

        for (const fbModel of fallbackCandidates) {
          if (response && response.ok) break;
          console.warn(`[Server /api/generate] Falling back to model ${fbModel}...`);
          try {
            const fbRes = await callGoogleApi(fbModel, effectiveKey);
            console.log(`[Server /api/generate] Model ${fbModel} returned status: ${fbRes.status}`);
            if (fbRes.ok) {
              response = fbRes;
              break;
            }
          } catch (fbErr) {
            console.warn(`[Server /api/generate] Exception calling ${fbModel}:`, fbErr);
          }
        }
      }

      // If still not ok and serverKey is available and different, try with serverKey
      if ((!response || !response.ok) && serverKey && effectiveKey !== serverKey) {
        console.warn('[Server /api/generate] Retrying with serverKey...');
        for (const modelToTry of [targetModel, 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite']) {
          if (response && response.ok) break;
          try {
            const retryRes = await callGoogleApi(modelToTry, serverKey);
            if (retryRes.ok) {
              response = retryRes;
              break;
            }
          } catch (err) {
            console.warn(`[Server /api/generate] Error retrying with ${modelToTry}:`, err);
          }
        }
      }

      if (!response) {
        return res.status(500).json({ error: 'No response received from Gemini API' });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `[Server /api/generate] Google API error (${response.status}): ${errorText.slice(0, 150)}`
        );
        return res.status(response.status).json({
          error: errorText,
          status: response.status,
        });
      }

      const data = await response.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn('[Server /api/generate] Empty candidates response from Gemini');
        return res.status(500).json({ error: 'Empty response from Gemini API' });
      }

      // Server-side JSON hardening: normalize keywords field and fallback if empty
      try {
        let cleaned = text
          .trim()
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .replace(/```(?:json)?/gi, '')
          .replace(/```/g, '')
          .trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        const obj = JSON.parse(cleaned);
        const title = obj.title || obj.Title || '';
        const desc = obj.description || obj.Description || '';
        const rawKw =
          obj.keywords ??
          obj.Keywords ??
          obj.tags ??
          obj.Tags ??
          obj.tag_list ??
          obj.keyword_list ??
          obj.keywords_list;

        let kwList: string[] = [];
        if (Array.isArray(rawKw)) {
          for (const k of rawKw) {
            if (typeof k === 'string') {
              for (const part of k.split(/[,;\n\r\t]+/)) {
                if (part.trim()) kwList.push(part.trim());
              }
            } else if (k && typeof k === 'object') {
              const val = (k as Record<string, unknown>).keyword ?? (k as Record<string, unknown>).tag ?? Object.values(k)[0];
              if (typeof val === 'string' && val.trim()) kwList.push(val.trim());
            }
          }
        } else if (typeof rawKw === 'string') {
          kwList = rawKw
            .split(/[,;\n\r|]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        }

        // If empty, re-derive from title + description so output is never 0 keywords
        if (kwList.length === 0 && (title || desc)) {
          kwList = deriveKeywordsFromText(title, desc);
        }

        if (kwList.length > 0) {
          const seen = new Set<string>();
          const deduped: string[] = [];
          for (const k of kwList) {
            const lower = k.toLowerCase().trim();
            if (lower && !seen.has(lower)) {
              seen.add(lower);
              deduped.push(k);
            }
          }
          obj.keywords = deduped;
          text = JSON.stringify(obj);
        }
      } catch {
        // Pass original text if custom parsing fails
      }

      console.log(`[Server /api/generate] Successfully generated ${text.length} chars response`);
      return res.json({ text });
    } catch (err: unknown) {
      console.error('[Server /api/generate] Internal server error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });

  // Key validation endpoint via Gemini models endpoint
  app.post('/api/validate-key', async (req: Request, res: ExpressResponse) => {
    try {
      const { apiKey } = req.body;
      const keyToTest = (apiKey || '').trim();
      if (!keyToTest) {
        return res.status(400).json({ valid: false, error: 'API key is required' });
      }

      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keyToTest)}`;
      console.log('[Server /api/validate-key] Validating key with Gemini models endpoint...');
      const googleRes = await fetch(testUrl);

      if (googleRes.ok) {
        console.log('[Server /api/validate-key] Key validation succeeded (HTTP 200)');
        return res.json({ valid: true });
      }

      const errText = await googleRes.text();
      let errorMsg = 'Invalid Gemini API key';
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {
        // fallback
      }
      console.warn(`[Server /api/validate-key] Key validation failed (HTTP ${googleRes.status}): ${errorMsg}`);
      return res.status(200).json({ valid: false, error: errorMsg });
    } catch (err: unknown) {
      console.warn('[Server /api/validate-key] Validation error:', err);
      return res.status(200).json({ valid: false, error: 'Could not reach Gemini models endpoint' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY),
    });
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StockMeta AI] Server ready on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[StockMeta AI] Failed to start server:', err);
  process.exit(1);
});
