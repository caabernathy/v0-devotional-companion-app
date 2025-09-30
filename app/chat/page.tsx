import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat/chat-interface"
import { AppHeader } from "@/components/layout/app-header"

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user's conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        <ChatInterface userId={user.id} conversations={conversations || []} />
      </main>
    </div>
  )
}
