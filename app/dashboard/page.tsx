import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DailyDevotional } from "@/components/devotional/daily-devotional"
import { ThemeInsights } from "@/components/themes/theme-insights"
import { AppHeader } from "@/components/layout/app-header"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch today's devotional
  const today = new Date().toISOString().split("T")[0]
  const { data: devotional } = await supabase.from("devotionals").select("*").eq("date", today).single()

  // Fetch theme aggregates for 7 and 30 day windows
  const { data: themes7Day } = await supabase
    .from("theme_aggregates")
    .select("*")
    .eq("user_id", user.id)
    .eq("window_days", 7)
    .order("frequency", { ascending: false })
    .limit(5)

  const { data: themes30Day } = await supabase
    .from("theme_aggregates")
    .select("*")
    .eq("user_id", user.id)
    .eq("window_days", 30)
    .order("frequency", { ascending: false })
    .limit(5)

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="space-y-8">
          <DailyDevotional devotional={devotional} />
          <ThemeInsights themes7Day={themes7Day || []} themes30Day={themes30Day || []} userId={user.id} />
        </div>
      </main>
    </div>
  )
}
