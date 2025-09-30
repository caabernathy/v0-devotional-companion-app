// Shared Gloo AI client for all Edge Functions
interface GlooAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

let cachedToken: string | null = null
let tokenExpiry = 0

// Declare Deno variable before using it
declare const Deno: any

export async function getGlooToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const clientId = Deno.env.get("GLOO_CLIENT_ID")
  const clientSecret = Deno.env.get("GLOO_CLIENT_SECRET")

  if (!clientId || !clientSecret) {
    throw new Error("Gloo AI credentials not configured")
  }

  // Get new token using client credentials flow
  const response = await fetch("https://platform.ai.gloo.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get Gloo token: ${response.statusText}`)
  }

  const data: GlooAuthResponse = await response.json()
  cachedToken = data.access_token
  // Set expiry to 5 minutes before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

  return cachedToken
}

export async function glooCompletion(prompt: string): Promise<string> {
  const token = await getGlooToken()
  const baseUrl = Deno.env.get("GLOO_BASE_URL") || "https://platform.ai.gloo.com/ai/v1"
  const model = Deno.env.get("GLOO_MODEL") || "us.anthropic.claude-sonnet-4-20250514-v1:0"

  const response = await fetch(`${baseUrl}/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gloo completion failed: ${error}`)
  }

  const data = await response.json()
  return data.choices[0].text
}

export async function glooMessages(messages: Array<{ role: string; content: string }>): Promise<string> {
  const token = await getGlooToken()
  const baseUrl = Deno.env.get("GLOO_BASE_URL") || "https://platform.ai.gloo.com/ai/v1"
  const model = Deno.env.get("GLOO_MODEL") || "us.anthropic.claude-sonnet-4-20250514-v1:0"

  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gloo messages failed: ${error}`)
  }

  const data = await response.json()
  return data.content[0].text
}
