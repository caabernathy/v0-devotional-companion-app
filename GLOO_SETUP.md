# Gloo AI Integration Setup

This app uses Gloo AI (Claude Sonnet 4) via Supabase Edge Functions for all AI features.

## Required Environment Variables

You need to set these secrets in your Supabase project:

\`\`\`bash
# Gloo AI Configuration
GLOO_BASE_URL=https://platform.ai.gloo.com/ai/v1
GLOO_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0
GLOO_CLIENT_ID=<your-gloo-client-id>
GLOO_CLIENT_SECRET=<your-gloo-client-secret>
\`\`\`

## Setting Secrets via Supabase CLI

1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Link your project: `supabase link --project-ref <your-project-ref>`
3. Set secrets:

\`\`\`bash
supabase secrets set GLOO_BASE_URL=https://platform.ai.gloo.com/ai/v1
supabase secrets set GLOO_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0
supabase secrets set GLOO_CLIENT_ID=<your-client-id>
supabase secrets set GLOO_CLIENT_SECRET=<your-client-secret>
\`\`\`

## Deploying Edge Functions

Deploy all Edge Functions to Supabase:

\`\`\`bash
supabase functions deploy devotional-today
supabase functions deploy chat
supabase functions deploy journal-prompts
supabase functions deploy theme-extract
\`\`\`

## Edge Functions Overview

### 1. `devotional-today`
- Generates daily devotional content
- Returns: verse, reflection, prayer points, themes
- Endpoint: `supabase.functions.invoke('devotional-today')`

### 2. `chat`
- Handles spiritual companion conversations
- Maintains conversation history
- Endpoint: `supabase.functions.invoke('chat', { body: { conversationId, message } })`

### 3. `journal-prompts`
- Generates contextual journal prompts
- Uses today's devotional for context
- Endpoint: `supabase.functions.invoke('journal-prompts')`

### 4. `theme-extract`
- Analyzes spiritual themes and provides insights
- Aggregates 7-day and 30-day patterns
- Endpoint: `supabase.functions.invoke('theme-extract')`

## Security

- All AI calls happen server-side in Edge Functions
- Gloo credentials never exposed to browser
- Row Level Security (RLS) enforced on all database operations
- User authentication verified in every Edge Function

## Testing Locally

Run Edge Functions locally:

\`\`\`bash
supabase functions serve
\`\`\`

Then test with:

\`\`\`bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/devotional-today' \
  --header 'Authorization: Bearer <your-anon-key>' \
  --header 'Content-Type: application/json'
