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

    // Fetch theme aggregates
    const { data: themes7Day } = await supabase
      .from("theme_aggregates")
      .select("*")
      .eq("user_id", user.id)
      .eq("window_days", 7)
      .order("frequency", { ascending: false })

    const { data: themes30Day } = await supabase
      .from("theme_aggregates")
      .select("*")
      .eq("user_id", user.id)
      .eq("window_days", 30)
      .order("frequency", { ascending: false })

    if (!themes7Day?.length && !themes30Day?.length) {
      return new Response(
        JSON.stringify({
          insights: "Continue your devotional practice to discover patterns in your spiritual journey.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Build context
    const themes7DayList = themes7Day?.map((t) => `${t.theme} (${t.frequency}x)`).join(", ") || "none"
    const themes30DayList = themes30Day?.map((t) => `${t.theme} (${t.frequency}x)`).join(", ") || "none"

    // Generate insights using Gloo AI
    const prompt = `Analyze these spiritual themes from a Christian devotional journey:

Past 7 days: ${themes7DayList}
Past 30 days: ${themes30DayList}

Provide:
1. What these themes reveal about the person's spiritual season
2. Practical applications for daily life
3. Encouragement for continued growth

Keep it warm, personal, and under 150 words.`

    const text = await glooCompletion(prompt)

    return new Response(JSON.stringify({ insights: text.trim() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error analyzing themes:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
