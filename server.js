// server.ts
import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// src/utils/compliance.ts
var BANNED_SPAM_WORDS = [
  "best",
  "top",
  "4k",
  "8k",
  "16k",
  "hd",
  "uhd",
  "full hd",
  "ultra hd",
  "ultra-hd",
  "masterpiece",
  "wallpaper",
  "stock photo",
  "stock image",
  "stock picture",
  "royalty free",
  "royalty-free",
  "isolated on white background",
  "isolated on white",
  "white background",
  "beautiful",
  "amazing",
  "incredible",
  "stunning",
  "gorgeous",
  "wonderful",
  "fantastic",
  "awesome",
  "nice",
  "pretty",
  "lovely",
  "perfect",
  "great",
  "good",
  "excellent",
  "high quality",
  "high-quality",
  "high resolution",
  "high-resolution",
  "photo",
  "picture",
  "image",
  "photograph",
  "background",
  "backdrop",
  "copy space",
  "negative space",
  "mockup",
  "template",
  "banner",
  "poster",
  "closeup",
  "close-up",
  "trending",
  "viral",
  "popular",
  "new",
  "free",
  "download",
  "shutterstock",
  "adobestock",
  "adobe stock",
  "getty",
  "gettyimages",
  "istock",
  "freepik",
  "vecteezy",
  "depositphotos",
  "dreamstime",
  "123rf",
  "alamy",
  "canva",
  "pond5",
  "envato",
  "bigstock"
];
var PROTECTED_TRADEMARKS = [
  "Apple",
  "iPhone",
  "iPad",
  "MacBook",
  "AirPods",
  "Samsung",
  "Galaxy",
  "Sony",
  "PlayStation",
  "Nintendo",
  "Switch",
  "Xbox",
  "Microsoft",
  "Microsoft Windows",
  "Google",
  "Android",
  "Pixel",
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "Gucci",
  "Louis Vuitton",
  "Chanel",
  "Prada",
  "Hermes",
  "Disney",
  "Marvel",
  "Pixar",
  "Star Wars",
  "Coca-Cola",
  "Coke",
  "Pepsi",
  "Red Bull",
  "Starbucks",
  "McDonald's",
  "KFC",
  "Tesla",
  "SpaceX",
  "Ferrari",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Porsche",
  "Lamborghini",
  "Toyota",
  "Honda",
  "Ford",
  "Volkswagen",
  "Instagram",
  "Facebook",
  "TikTok",
  "Twitter",
  "YouTube",
  "Netflix",
  "Spotify",
  "Amazon",
  "Prime",
  "ChatGPT",
  "OpenAI",
  "Midjourney",
  "DALL-E",
  "LEGO",
  "Barbie",
  "Hot Wheels",
  "IKEA",
  "Zara",
  "H&M",
  "Uniqlo",
  "Rolex",
  "Cartier",
  "Ray-Ban",
  "Oakley",
  "Canon",
  "Nikon",
  "GoPro",
  "DJI",
  "Bose",
  "JBL",
  "Philips",
  "Panasonic",
  "LG",
  "Huawei",
  "Xiaomi",
  "Lenovo",
  "Dell",
  "HP",
  "Intel",
  "AMD",
  "NVIDIA",
  "Adobe",
  "Photoshop",
  "Heineken",
  "Budweiser",
  "Corona",
  "Marlboro",
  "Kleenex",
  "Band-Aid",
  "Velcro",
  "Post-it",
  "Sharpie",
  "Jeep",
  "Harley-Davidson"
];
var GENERIC_DICTIONARY_WORDS = /* @__PURE__ */ new Set([
  "windows",
  "window",
  "switch",
  "switches",
  "prime",
  "galaxy",
  "galaxies",
  "pixel",
  "pixels",
  "apple",
  "apples"
]);
var STOPWORDS = /* @__PURE__ */ new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "featuring",
  "depicting",
  "showing",
  "contains",
  "view",
  "close"
]);
var SORTED_BANNED_WORDS = [...BANNED_SPAM_WORDS].sort((a, b) => b.length - a.length);
var BANNED_WORDS_REGEX = SORTED_BANNED_WORDS.map((w) => {
  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "gi");
});
var BANNED_WORDS_SET = new Set(BANNED_SPAM_WORDS.map((w) => w.toLowerCase()));
var PROTECTED_TRADEMARKS_SET = new Set(
  PROTECTED_TRADEMARKS.map((t) => t.toLowerCase()).filter((t) => !GENERIC_DICTIONARY_WORDS.has(t))
);
function deriveKeywordsFromText(title, description = "") {
  const combined = `${title || ""} ${description || ""}`;
  if (!combined.trim()) return [];
  const rawTokens = combined.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !BANNED_WORDS_SET.has(t));
  const seen = /* @__PURE__ */ new Set();
  const derived = [];
  const cleanTitleWords = (title || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
  for (let i = 0; i < cleanTitleWords.length - 1; i++) {
    const w1 = cleanTitleWords[i];
    const w2 = cleanTitleWords[i + 1];
    if (w1.length >= 3 && w2.length >= 3 && !STOPWORDS.has(w1) && !STOPWORDS.has(w2) && !BANNED_WORDS_SET.has(w1) && !BANNED_WORDS_SET.has(w2)) {
      const phrase = `${w1} ${w2}`;
      if (!seen.has(phrase)) {
        seen.add(phrase);
        derived.push(phrase);
      }
    }
  }
  for (const token of rawTokens) {
    if (!seen.has(token) && !BANNED_WORDS_SET.has(token)) {
      seen.add(token);
      derived.push(token);
    }
  }
  return derived.slice(0, 35);
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var ADOBE_STOCK_PROMPT = `You are an Adobe Stock metadata specialist. Given one or more asset files (images or videos), you produce SEO-optimised titles and keywords that maximise discoverability while strictly following Adobe Stock's content policies.
1 \u2014 TITLE WRITING: Analyse each asset's visible content and conceptual meaning, then write a title using the words an Adobe Stock buyer would actually type into the search bar. Framework: Core subject / concept + important action / detail + essential context / style. Keep each title \u2264 200 characters (or specified target title length). Use Title Case. Do not stuff the title with keywords; keep it natural and descriptive.
2 \u2014 KEYWORD WRITING: 2.1 Pre-analysis (mandatory) \u2014 before generating a single keyword, identify: Main subject, Action, Concept, Setting/context, Style, Buyer intent. 2.2 Keyword Priority System (strict order): Slots 1\u20133 Primary search concepts; 4\u20136 Main visible elements; 7\u201310 Strong differentiators; 11\u201320 Supporting keywords; 21\u201335 Secondary discovery keywords; 36\u201349 Extended discovery. IMPORTANT: Every important concept in the title must appear within the first 10 keywords. 2.3 Quantity: Generate the user's specified target keyword count (default: 15\u201335 highly relevant keywords if no target count is specified; absolute max 49). Thoroughly cover all visible and conceptual angles to reach the requested count. Soft no-filler guard: if relevance becomes genuinely exhausted, stop at the last relevant keyword (never add junk filler merely to reach a number), but AIM for the requested target count first. 2.4 Ranking: first 10 carry greatest weight \u2014 strongest first. Describe visible content AND conceptual meaning. Think like a buyer.
3 \u2014 STRICT RULES: DO: think like a buyer; accuracy over quantity; strongest keyword first; title concepts in first 10; multi-word keywords only for meaningful searched concepts; one language consistently; differentiate similar assets. DO NOT: duplicate keywords; singular/plural variations; synonym stuffing; invisible concepts; guess usage; irrelevant background objects; trademarks/brands/artist names/IP; title as keyword phrase; spam.
4 \u2014 OUTPUT: JSON {title, description, keywords, category} where category is one of 5 (Environment), 8 (Graphics), 16 (Science), 19 (Technology). Description: 1\u20132 sentences matching specified target description length.`;
var VIDEO_MULTI_FRAME_INSTRUCTIONS = `Asset media type: Video footage clip (sequential representative frames provided as chronological image parts).
VIDEO MULTI-FRAME ANALYSIS INSTRUCTIONS:
You are analyzing multiple representative chronological frames extracted across the video clip's full duration (covering start, progressive action, climax, and ending). Analyze the actual visual content and motion ACROSS ALL frames:
1. Action & Motion: Identify what is happening throughout the sequence \u2014 continuous physical actions, movement of subjects/vehicles/elements across time, camera dynamics (e.g., aerial drone, tracking shot, panning, zoom, time-lapse, slow motion), and scene transitions.
2. Subject & People: Accurately identify who or what is featured (e.g., medical specialist, golden retriever, industrial welder, container ship, software engineers) and their interactions.
3. Setting & Environment: Describe visible background, indoor/outdoor lighting, architecture, natural scenery, weather, time of day, atmosphere, and real-world environment.
5. Adobe Stock Title & Keywords Rules: Synthesize the full visual story across all frames into a compelling commercial stock title (Title Case, matching target title length) that stock buyers actually search for. Generate the requested target count of highly relevant keywords strictly ordered by priority (slots 1\u20133 primary concepts, 4\u20136 main visible elements/actions, 7\u201310 differentiators, 11\u201320 supporting, 21\u201335 secondary discovery, 36\u201349 extended discovery). Aim for the requested target keyword count; do not add filler or duplicate tags.
6. Real Visual Content Focus: If any frame is black, blank, or an intro/outro slate/fade, completely ignore the black screen and describe exclusively the actual visual subject, actions, people, props, and scene in the footage.`;
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(express.json({ limit: "50mb" }));
  app.post("/api/generate", async (req, res) => {
    try {
      const { model, prompt, inlineParts, apiKey, isVideo, settings } = req.body;
      const userKey = (req.headers["x-api-key"] || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : "") || apiKey || "").trim();
      const isPlaceholder = !userKey || userKey === "GEMINI_API_KEY" || userKey === "MY_GEMINI_API_KEY" || userKey.startsWith("TODO") || userKey.toLowerCase().includes("placeholder");
      if (isPlaceholder) {
        console.warn("[Server /api/generate] Rejected: No valid visitor Gemini API key provided");
        return res.status(400).json({
          error: "API key required \u2014 add your own Gemini API key in settings"
        });
      }
      const effectiveKey = userKey;
      const partsCount = Array.isArray(inlineParts) ? inlineParts.length : 0;
      const isMultiFrameVideo = Boolean(isVideo || partsCount > 1);
      console.log(
        `[Server /api/generate] Request received with visitor key. Model: ${model || "gemini-3.8-flash"}, parts: ${partsCount} (${isMultiFrameVideo ? "video multi-frame analysis" : "single asset"}), keyLength: ${effectiveKey.length}`
      );
      const targetModel = model || "gemini-3.8-flash";
      let promptText = prompt && String(prompt).trim().length > 0 ? String(prompt).trim() : ADOBE_STOCK_PROMPT;
      if (settings && !promptText.includes("USER ESSENTIAL SETTINGS TARGETS")) {
        const titleLen = settings.titleLength || 200;
        const descLen = settings.descriptionLength || 200;
        const kwCount = settings.keywordsCount || 35;
        promptText += `

USER ESSENTIAL SETTINGS TARGETS (AUTHORITATIVE):
- Title Length Target: \u2264 ${titleLen} characters
- Description Length Target: \u2264 ${descLen} characters
- Keywords Count Target: Generate ${kwCount} relevant keywords (AIM for ${kwCount} first; soft no-filler guard).`;
      }
      if (isMultiFrameVideo && !promptText.includes("VIDEO MULTI-FRAME ANALYSIS INSTRUCTIONS")) {
        promptText += "\n\n" + VIDEO_MULTI_FRAME_INSTRUCTIONS;
      }
      const parts = [{ text: promptText }];
      if (Array.isArray(inlineParts)) {
        for (const p of inlineParts) {
          if (p?.data) {
            parts.push({
              inlineData: {
                mimeType: p.mime_type || p.mimeType || "image/jpeg",
                data: p.data
              }
            });
          }
        }
      }
      const callGoogleApi = async (m, keyToUse) => {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${keyToUse}`;
        console.log(`[Server /api/generate] Sending fetch request to Google API (model: ${m})...`);
        return fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });
      };
      let response = null;
      try {
        response = await callGoogleApi(targetModel, effectiveKey);
        console.log(`[Server /api/generate] Target model ${targetModel} returned status: ${response.status}`);
      } catch (err) {
        console.warn(`[Server /api/generate] Target model call failed:`, err);
      }
      if (!response || response.status === 429 || !response.ok) {
        const fallbackCandidates = [
          "gemini-3.5-flash",
          "gemini-3.5-flash-lite",
          "gemini-2.5-flash-lite"
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
      if (!response) {
        return res.status(500).json({ error: "No response received from Gemini API" });
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `[Server /api/generate] Google API error (${response.status}): ${errorText.slice(0, 150)}`
        );
        return res.status(response.status).json({
          error: errorText,
          status: response.status
        });
      }
      const data = await response.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn("[Server /api/generate] Empty candidates response from Gemini");
        return res.status(500).json({ error: "Empty response from Gemini API" });
      }
      try {
        let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        const obj = JSON.parse(cleaned);
        const title = obj.title || obj.Title || "";
        const desc = obj.description || obj.Description || "";
        const rawKw = obj.keywords ?? obj.Keywords ?? obj.tags ?? obj.Tags ?? obj.tag_list ?? obj.keyword_list ?? obj.keywords_list;
        let kwList = [];
        if (Array.isArray(rawKw)) {
          for (const k of rawKw) {
            if (typeof k === "string") {
              for (const part of k.split(/[,;\n\r\t]+/)) {
                if (part.trim()) kwList.push(part.trim());
              }
            } else if (k && typeof k === "object") {
              const val = k.keyword ?? k.tag ?? Object.values(k)[0];
              if (typeof val === "string" && val.trim()) kwList.push(val.trim());
            }
          }
        } else if (typeof rawKw === "string") {
          kwList = rawKw.split(/[,;\n\r|]+/).map((s) => s.trim()).filter(Boolean);
        }
        if (kwList.length === 0 && (title || desc)) {
          kwList = deriveKeywordsFromText(title, desc);
        }
        if (kwList.length > 0) {
          const seen = /* @__PURE__ */ new Set();
          const deduped = [];
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
      }
      console.log(`[Server /api/generate] Successfully generated ${text.length} chars response`);
      return res.json({ text });
    } catch (err) {
      console.error("[Server /api/generate] Internal server error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });
  app.post("/api/validate-key", async (req, res) => {
    try {
      const { apiKey } = req.body;
      const keyToTest = (apiKey || "").trim();
      if (!keyToTest) {
        return res.status(400).json({ valid: false, error: "API key is required" });
      }
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keyToTest)}`;
      console.log("[Server /api/validate-key] Validating key with Gemini models endpoint...");
      const googleRes = await fetch(testUrl);
      if (googleRes.ok) {
        console.log("[Server /api/validate-key] Key validation succeeded (HTTP 200)");
        return res.json({ valid: true });
      }
      const errText = await googleRes.text();
      let errorMsg = "Invalid Gemini API key";
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {
      }
      console.warn(`[Server /api/validate-key] Key validation failed (HTTP ${googleRes.status}): ${errorMsg}`);
      return res.status(200).json({ valid: false, error: errorMsg });
    } catch (err) {
      console.warn("[Server /api/validate-key] Validation error:", err);
      return res.status(200).json({ valid: false, error: "Could not reach Gemini models endpoint" });
    }
  });
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY)
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {}
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[StockMeta AI] Server ready on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[StockMeta AI] Failed to start server:", err);
  process.exit(1);
});
export {
  ADOBE_STOCK_PROMPT,
  VIDEO_MULTI_FRAME_INSTRUCTIONS
};
