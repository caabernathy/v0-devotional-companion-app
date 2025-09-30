import { createClient } from "jsr:@supabase/supabase-js@2"
import { glooMessages } from "../_shared/gloo-client.ts"
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

    const { conversationId, message } = await req.json()

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Load conversation history
    const { data: history } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10)

    // Build messages array for Gloo
    const messages = [
      {
        role: "system",
        content:
          "You are a compassionate Christian spiritual companion. Help users explore their faith, understand scripture, and grow spiritually. Be warm, encouraging, and grounded in biblical wisdom.",
      },
    ]

    // Add conversation history
    if (history) {
      history.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      })
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    })

    // Save user message
    await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    })

    // Generate AI response using Gloo
    const responseText = await glooMessages(messages)

    // Save assistant message
    const { data: assistantMessage } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: responseText,
      })
      .select()
      .single()

    // Update conversation timestamp
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)

    return new Response(JSON.stringify({ message: assistantMessage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in chat:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
