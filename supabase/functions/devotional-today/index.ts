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

    // Check if devotional already exists for today
    const today = new Date().toISOString().split("T")[0]
    const { data: existing } = await supabase.from("devotionals").select("id").eq("date", today).single()

    if (existing) {
      return new Response(JSON.stringify({ message: "Devotional already exists for today" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate devotional using Gloo AI
    const prompt = `Generate a Christian daily devotional for today. Include:
1. A Bible verse reference and the full verse text
2. A thoughtful reflection (2-3 paragraphs) on the verse
3. Three specific prayer points
4. 3-5 themes from the devotional

Format your response as JSON with this structure:
{
  "verse_reference": "Book Chapter:Verse",
  "verse_text": "The full verse text",
  "reflection": "2-3 paragraph reflection",
  "prayer_points": ["point 1", "point 2", "point 3"],
  "themes": ["theme1", "theme2", "theme3"]
}`

    const text = await glooCompletion(prompt)

    // Parse AI response
    const devotionalData = JSON.parse(text)

    // Insert into database
    const { data: devotional, error } = await supabase
      .from("devotionals")
      .insert({
        date: today,
        verse_reference: devotionalData.verse_reference,
        verse_text: devotionalData.verse_text,
        reflection: devotionalData.reflection,
        prayer_points: devotionalData.prayer_points,
        themes: devotionalData.themes,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ devotional }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error generating devotional:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
