import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { glooMessages } from "@/lib/gloo-client"

export async function POST(request: Request) {
  try {
    const { conversationId, message } = await request.json()

    if (!conversationId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Save user message
    await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    })

    // Get conversation history
    const { data: history } = await supabase
      .from("conversation_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20)

    // Build messages array for Gloo
    const messages = [
      {
        role: "system",
        content:
          "You are a compassionate Christian spiritual companion. Provide thoughtful, biblically-grounded guidance while being warm and understanding. Keep responses concise and focused.",
      },
      ...(history || []),
      { role: "user", content: message },
    ]

    // Get AI response from Gloo
    const aiResponse = await glooMessages(messages)

    // Save AI response
    await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: aiResponse,
    })

    // Update conversation timestamp
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
