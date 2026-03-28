<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your reporting app

This project is a Vite dashboard with a server-side Gemini analysis endpoint for secure report uploads on Vercel.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` and set `GEMINI_API_KEY` to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Vercel

1. Import the repo into Vercel.
2. In `Project Settings -> Environment Variables`, add:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (optional, defaults to `gemini-2.5-flash`)
3. Redeploy the project.

The frontend now sends uploads to `/api/analyze-report`, so the Gemini key stays on the server and is not exposed to the browser bundle.
