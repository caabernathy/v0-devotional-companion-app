// Shared Gloo AI client for all Edge Functions
interface GlooAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface GlooChatMessage {
  role: string
  content: string
}

interface GlooChatResponse {
  choices: Array<{ message?: GlooChatMessage; text?: string }>
}

let cachedToken: string | null = null
let tokenExpiry = 0

// Declare Deno globals used below
declare const Deno: any
declare const btoa: (data: string) => string

const TOKEN_ENDPOINT = Deno.env.get("GLOO_TOKEN_URL") || "https://platform.ai.gloo.com/oauth2/token"
const TOKEN_SCOPE = Deno.env.get("GLOO_AUTH_SCOPE") || "api/access"
const API_BASE = Deno.env.get("GLOO_BASE_URL") || "https://platform.ai.gloo.com/ai/v1"
const DEFAULT_MODEL = Deno.env.get("GLOO_MODEL") || "us.anthropic.claude-sonnet-4-20250514-v1:0"

function withTrailingPath(base: string, path: string): string {
  return `${base.replace(/\/?$/, "")}/${path.replace(/^\//, "")}`
}

export async function getGlooToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const clientId = Deno.env.get("GLOO_CLIENT_ID")
  const clientSecret = Deno.env.get("GLOO_CLIENT_SECRET")

  if (!clientId || !clientSecret) {
    throw new Error("Gloo AI credentials not configured")
  }

  const authHeader = btoa(`${clientId}:${clientSecret}`)
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: TOKEN_SCOPE,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get Gloo token: ${response.status} ${response.statusText} ${errorText}`.trim())
  }

  const data: GlooAuthResponse = await response.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + Math.max(data.expires_in - 300, 60) * 1000

  return cachedToken
}

async function glooChat(messages: GlooChatMessage[], temperature = 0.7): Promise<string> {
  const token = await getGlooToken()
  const endpoint = withTrailingPath(API_BASE, "chat/completions")

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      max_tokens: 2000,
      temperature,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gloo chat request failed: ${response.status} ${response.statusText} ${errorText}`.trim())
  }

  const data: GlooChatResponse = await response.json()
  const choice = data.choices?.[0]
  const content = choice?.message?.content ?? choice?.text

  if (!content) {
    throw new Error("Gloo chat response did not include message content")
  }

  return content
}

export async function glooCompletion(prompt: string): Promise<string> {
  return glooChat([{ role: "user", content: prompt }])
}

export async function glooMessages(messages: Array<{ role: string; content: string }>): Promise<string> {
  return glooChat(messages)
}
