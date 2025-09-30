# Devotional Companion App

A Next.js-based devotional companion application that provides AI-generated daily devotions and interactive chat functionality powered by Gloo AI and Supabase.

## Features

- AI-generated daily devotionals using Claude Sonnet 4
- Interactive chat interface for spiritual guidance
- User authentication and data persistence with Supabase
- Modern UI built with React, Tailwind CSS, and Radix UI components
- Responsive design for mobile and desktop

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Gloo AI API credentials (client ID and secret)

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd v0-devotional-companion-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the `env.example` file to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

   Update `.env.local` with your actual credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   GLOO_BASE_URL=https://platform.ai.gloo.com/ai/v1
   GLOO_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0
   GLOO_CLIENT_ID=<your-client-id>
   GLOO_CLIENT_SECRET=<your-client-secret>
   ```

   **Where to get credentials:**
   - **Supabase**: Create a project at [supabase.com](https://supabase.com), then find your URL and anon key in Project Settings > API
   - **Gloo AI**: Sign up at [gloo.com](https://gloo.com) and obtain your client ID and secret from your dashboard

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **AI**: Gloo AI (Claude Sonnet 4)
- **Database**: Supabase
- **Deployment**: Vercel

## Deployment

This project is configured for deployment on Vercel. Connect your repository to Vercel and ensure all environment variables from `env.example` are configured in your Vercel project settings.

## Resources
- Planning: [Claude chat](https://claude.ai/share/83f6a8ac-fd62-4c7a-82aa-5517a4b501a6) | [ChatGPT chat](https://chatgpt.com/share/68db3caf-54d0-8000-b855-d90ea18fdbdb)
- Video walk-through initial setup: [Part 1 - v0](https://youtu.be/bsPGJMWYTQA) | [Part 2 - Lovable](https://youtu.be/4FzbxN2QPvU) | [Part 3 - VS Code + Codex](https://youtu.be/3Pdf4tG0s8M)

## License

MIT License - see [LICENSE](LICENSE) file for details
