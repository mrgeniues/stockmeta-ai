export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: 'What is StockMeta AI?',
    answer:
      'StockMeta AI is a free AI tool that generates stock-ready titles, descriptions and keywords for photos, illustrations and videos using Gemini.',
  },
  {
    question: 'Do I need an API key?',
    answer:
      "Yes, a free Gemini API key; get one via the 'Get a free key' link in the settings above.",
  },
  {
    question: 'Is my API key secure?',
    answer:
      "Yes: stored only in your browser localStorage and sent only to Google's Gemini API, never to any other server.",
  },
  {
    question: 'Is it free?',
    answer:
      'The app is free; the Gemini API free tier covers typical use.',
  },
  {
    question: 'Which file types are supported?',
    answer:
      'JPEG, PNG, WebP, SVG images; MP4, AVI, MOV, WMV, FLV, WebM videos.',
  },
  {
    question: 'What keyword formats are available?',
    answer:
      'Single = one keyword per phrase (single words only, no phrases); Double = two-word combinations; Auto = AI decides the best mix.',
  },
  {
    question: 'Can I include or exclude keywords?',
    answer:
      'Yes: add must-include and must-exclude keywords as chips; includes are always present, excludes are always removed.',
  },
  {
    question: 'How customizable are titles/descriptions/keywords?',
    answer:
      'Sliders control max title/description length and keyword count, format buttons control keyword style, and every result field is editable before export.',
  },
];
