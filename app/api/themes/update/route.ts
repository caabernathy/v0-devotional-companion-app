import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get devotionals from the past 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0]

    const { data: devotionals } = await supabase
      .from("devotionals")
      .select("date, themes")
      .gte("date", thirtyDaysAgoStr)
      .order("date", { ascending: false })

    if (!devotionals || devotionals.length === 0) {
      return NextResponse.json({ message: "No devotionals to analyze" }, { status: 200 })
    }

    // Aggregate themes for 7 and 30 day windows
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

    const themes7DayMap = new Map<string, { frequency: number; firstSeen: string; lastSeen: string }>()
    const themes30DayMap = new Map<string, { frequency: number; firstSeen: string; lastSeen: string }>()

    devotionals.forEach((dev) => {
      const isIn7Days = dev.date >= sevenDaysAgoStr
      dev.themes.forEach((theme: string) => {
        // 30 day window
        if (!themes30DayMap.has(theme)) {
          themes30DayMap.set(theme, { frequency: 0, firstSeen: dev.date, lastSeen: dev.date })
        }
        const theme30 = themes30DayMap.get(theme)!
        theme30.frequency++
        theme30.lastSeen = dev.date > theme30.lastSeen ? dev.date : theme30.lastSeen
        theme30.firstSeen = dev.date < theme30.firstSeen ? dev.date : theme30.firstSeen

        // 7 day window
        if (isIn7Days) {
          if (!themes7DayMap.has(theme)) {
            themes7DayMap.set(theme, { frequency: 0, firstSeen: dev.date, lastSeen: dev.date })
          }
          const theme7 = themes7DayMap.get(theme)!
          theme7.frequency++
          theme7.lastSeen = dev.date > theme7.lastSeen ? dev.date : theme7.lastSeen
          theme7.firstSeen = dev.date < theme7.firstSeen ? dev.date : theme7.firstSeen
        }
      })
    })

    // Clear existing theme aggregates for this user
    await supabase.from("theme_aggregates").delete().eq("user_id", user.id)

    // Insert new aggregates
    const aggregates = []

    themes7DayMap.forEach((data, theme) => {
      aggregates.push({
        user_id: user.id,
        theme,
        frequency: data.frequency,
        first_seen: data.firstSeen,
        last_seen: data.lastSeen,
        window_days: 7,
      })
    })

    themes30DayMap.forEach((data, theme) => {
      aggregates.push({
        user_id: user.id,
        theme,
        frequency: data.frequency,
        first_seen: data.firstSeen,
        last_seen: data.lastSeen,
        window_days: 30,
      })
    })

    if (aggregates.length > 0) {
      await supabase.from("theme_aggregates").insert(aggregates)
    }

    return NextResponse.json({ message: "Themes updated successfully", count: aggregates.length }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error updating themes:", error)
    return NextResponse.json({ error: "Failed to update themes" }, { status: 500 })
  }
}
