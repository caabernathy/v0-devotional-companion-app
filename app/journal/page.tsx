import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JournalInterface } from "@/components/journal/journal-interface"
import { AppHeader } from "@/components/layout/app-header"

export default async function JournalPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user's journal entries
  const { data: journals } = await supabase
    .from("journals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        <JournalInterface userId={user.id} journals={journals || []} />
      </main>
    </div>
  )
}
