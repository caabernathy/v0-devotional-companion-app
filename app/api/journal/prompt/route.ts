import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { glooCompletion } from "@/lib/gloo-client"

export async function POST(request: Request) {
  try {
    const { devotionalId } = await request.json()

    const supabase = await createServerClient()

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let prompt = "Generate a thoughtful journaling prompt for spiritual reflection. "

    // If devotional ID provided, get context
    if (devotionalId) {
      const { data: devotional } = await supabase
        .from("devotionals")
        .select("verse_reference, reflection, themes")
        .eq("id", devotionalId)
        .single()

      if (devotional) {
        prompt += `Base it on today's devotional about ${devotional.verse_reference} focusing on themes: ${devotional.themes.join(", ")}. `
      }
    }

    prompt += "Keep it concise (1-2 sentences) and open-ended to encourage deep reflection."

    const response = await glooCompletion(prompt)

    return NextResponse.json({ prompt: response.trim() })
  } catch (error) {
    console.error("Journal prompt error:", error)
    return NextResponse.json({ error: "Failed to generate prompt" }, { status: 500 })
  }
}
