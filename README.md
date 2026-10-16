# StockMeta AI

StockMeta AI — upload stock photos and generate titles, descriptions, and keywords with AI.

## Run (Node app)

```bash
npm install
npm run build
NODE_ENV=production npm start
```

`server.ts` serves the built `dist/` frontend plus `/api/*` on one port (`npm start` runs `tsx server.ts`).

## Environment variables

- `GEMINI_API_KEY` — server fallback for the Gemini API. Optional: each visitor can also use their own browser key in the app. Do not commit a real key; copy `.env.example` to `.env` locally if needed.
- `NODE_ENV=production` — recommended for production.
- `PORT` — optional. If unset, the server uses its default port (or the port assigned by the hosting platform).

## Notes

- Never commit a `.env` file or a real API key.
- The app works with each visitor's own browser key when no server key is configured.
