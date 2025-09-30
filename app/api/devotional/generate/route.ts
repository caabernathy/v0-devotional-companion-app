import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { glooCompletion } from "@/lib/gloo-client"

export async function POST(request: Request) {
  try {
    const { date } = await request.json()
    const targetDate = date || new Date().toISOString().split("T")[0]

    const supabase = await createServerClient()

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if devotional already exists for this date
    const { data: existing } = await supabase
      .from("devotionals")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", targetDate)
      .single()

    if (existing) {
      return NextResponse.json(existing)
    }

    // Generate devotional using Gloo AI
    const prompt = `Generate a daily Christian devotional for ${targetDate}. Include:
1. A Bible verse reference and the full verse text
2. A thoughtful reflection (2-3 paragraphs) on the verse's meaning and application
3. Three specific prayer points
4. 2-3 spiritual themes (single words like "faith", "grace", "perseverance")

Format as JSON:
{
  "verse_reference": "Book Chapter:Verse",
  "verse_text": "Full verse text",
  "reflection": "Reflection text",
  "prayer_points": ["point 1", "point 2", "point 3"],
  "themes": ["theme1", "theme2"]
}`

    const response = await glooCompletion(prompt)

    // Parse the JSON response
    const devotionalData = JSON.parse(response)

    // Save to database
    const { data: devotional, error } = await supabase
      .from("devotionals")
      .insert({
        user_id: user.id,
        date: targetDate,
        verse_reference: devotionalData.verse_reference,
        verse_text: devotionalData.verse_text,
        reflection: devotionalData.reflection,
        prayer_points: devotionalData.prayer_points,
        themes: devotionalData.themes,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(devotional)
  } catch (error) {
    console.error("Devotional generation error:", error)
    return NextResponse.json({ error: "Failed to generate devotional" }, { status: 500 })
  }
}
