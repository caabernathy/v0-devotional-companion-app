"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Send, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

interface ChatInterfaceProps {
  userId: string
  conversations: Conversation[]
}

export function ChatInterface({ userId, conversations: initialConversations }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversations[0]?.id || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId)
    }
  }, [currentConversationId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  const createNewConversation = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title: "New Conversation",
      })
      .select()
      .single()

    if (data && !error) {
      setConversations([data, ...conversations])
      setCurrentConversationId(data.id)
      setMessages([])
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !currentConversationId || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          message: userMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      // Reload messages from database to get the real IDs
      await loadMessages(currentConversationId)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        {/* Conversations Sidebar */}
        <Card className="border-border/50 shadow-sm h-[calc(100vh-12rem)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Button size="icon" variant="ghost" onClick={createNewConversation}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1 p-4 pt-0">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setCurrentConversationId(conv.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      currentConversationId === conv.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {conv.title || "New Conversation"}
                  </button>
                ))}
                {conversations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="border-border/50 shadow-sm h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Spiritual Companion</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="space-y-4 py-4">
                {messages.length === 0 && !currentConversationId && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Start a new conversation to begin</p>
                  </div>
                )}
                {messages.length === 0 && currentConversationId && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Ask me anything about faith, scripture, or your spiritual journey
                    </p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t border-border/50 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about faith, scripture, or spiritual guidance..."
                  disabled={!currentConversationId || isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={!currentConversationId || isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
