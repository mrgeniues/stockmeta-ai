# StockMeta AI

StockMeta AI — upload stock photos and generate titles, descriptions, and keywords with AI.

## API keys — each visitor's own key only

This app uses ONLY each visitor's own Gemini API key, entered in the app's API Key settings. There is NO server-side API key, NO built-in key, and NO server fallback.

- If a visitor has not added their own key, generation does not run. The app shows an "Add API key" prompt with a button that opens the API Key settings.
- The server's `/api/generate` endpoint returns HTTP 400 with the error "API key required — add your own Gemini API key in settings" when no visitor key is forwarded.
- Never commit a `.env` file or a real API key.

## Run (Node app)

```bash
npm install
npm run build
NODE_ENV=production npm start
```

`server.ts` serves the built `dist/` frontend plus `/api/*` on one port (`npm start` runs `tsx server.ts`).

## Environment variables

- `NODE_ENV=production` — recommended for production.
- `PORT` — optional. If unset, the server uses its default port (or the port assigned by the hosting platform).
- No `GEMINI_API_KEY` / `API_KEY` is used or required on the server.

## Notes

- Each visitor adds their own Gemini API key in the app; keys are stored only in that visitor's browser (localStorage).
- Do not set any server-side API key.
