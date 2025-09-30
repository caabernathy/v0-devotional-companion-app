import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { glooCompletion } from "@/lib/gloo-client"

export async function POST(request: Request) {
  try {
    const { themes, period } = await request.json()

    if (!themes || themes.length === 0) {
      return NextResponse.json({ insight: "No themes to analyze yet." })
    }

    const supabase = await createServerClient()

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prompt = `Analyze these spiritual themes from the past ${period} days: ${themes.join(", ")}. 
Provide a brief (2-3 sentences) insight about what these recurring themes might indicate about the person's spiritual journey. 
Be encouraging and thoughtful.`

    const insight = await glooCompletion(prompt)

    return NextResponse.json({ insight: insight.trim() })
  } catch (error) {
    console.error("Theme analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze themes" }, { status: 500 })
  }
}
