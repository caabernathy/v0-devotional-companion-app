import { createClient } from "jsr:@supabase/supabase-js@2"
import { glooCompletion } from "../_shared/gloo-client.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Declare Deno global for TypeScript
declare const Deno: any

serve(async (req) => {
  try {
    // Create Supabase client with user's auth
    const authHeader = req.headers.get("Authorization")!
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    })

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get today's devotional for context
    const today = new Date().toISOString().split("T")[0]
    const { data: devotional } = await supabase.from("devotionals").select("*").eq("date", today).single()

    let context = ""
    if (devotional) {
      context = `Today's devotional was about ${devotional.verse_reference}: "${devotional.verse_text}". The themes were: ${devotional.themes.join(", ")}.`
    }

    // Generate journal prompt using Gloo AI
    const prompt = `Generate a thoughtful journal prompt for Christian spiritual reflection. ${context}

The prompt should:
- Be open-ended and encourage deep reflection
- Connect to faith, scripture, or spiritual growth
- Be personal and introspective
- Be 1-2 sentences

Return only the prompt text, nothing else.`

    const text = await glooCompletion(prompt)

    return new Response(JSON.stringify({ prompt: text.trim() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error generating journal prompt:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
