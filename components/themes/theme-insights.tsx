"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Calendar, Sparkles } from "lucide-react"
import { useState } from "react"

interface ThemeAggregate {
  id: string
  user_id: string
  theme: string
  frequency: number
  first_seen: string
  last_seen: string
  window_days: number
}

interface ThemeInsightsProps {
  themes7Day: ThemeAggregate[]
  themes30Day: ThemeAggregate[]
  userId: string
}

export function ThemeInsights({ themes7Day, themes30Day, userId }: ThemeInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)

  const analyzeThemes = async () => {
    setIsAnalyzing(true)
    try {
      const allThemes = [...themes7Day.map((t) => t.theme), ...themes30Day.map((t) => t.theme)]
      const uniqueThemes = Array.from(new Set(allThemes))

      const response = await fetch("/api/themes/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          themes: uniqueThemes,
          period: 30,
        }),
      })

      if (!response.ok) throw new Error("Failed to analyze themes")

      const data = await response.json()

      if (data?.insight) {
        setInsights(data.insight)
      }
    } catch (error) {
      console.error("Failed to analyze themes:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (themes7Day.length === 0 && themes30Day.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Spiritual Themes</CardTitle>
          <CardDescription>Track recurring themes in your devotional journey</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Continue your devotional practice to discover patterns and themes in your spiritual growth
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 7 Day Themes */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">This Week</CardTitle>
            </div>
            <CardDescription>Themes from the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {themes7Day.length > 0 ? (
              <div className="space-y-3">
                {themes7Day.map((theme) => (
                  <div key={theme.id} className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm">
                      {theme.theme}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{theme.frequency}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No themes tracked yet this week</p>
            )}
          </CardContent>
        </Card>

        {/* 30 Day Themes */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">This Month</CardTitle>
            </div>
            <CardDescription>Themes from the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {themes30Day.length > 0 ? (
              <div className="space-y-3">
                {themes30Day.map((theme) => (
                  <div key={theme.id} className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm">
                      {theme.theme}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{theme.frequency}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No themes tracked yet this month</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Spiritual Insights</CardTitle>
            </div>
            <Button onClick={analyzeThemes} disabled={isAnalyzing} size="sm">
              {isAnalyzing ? "Analyzing..." : "Generate Insights"}
            </Button>
          </div>
          <CardDescription>AI-powered analysis of your spiritual journey</CardDescription>
        </CardHeader>
        <CardContent>
          {insights ? (
            <p className="text-sm leading-relaxed text-foreground">{insights}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click &quot;Generate Insights&quot; to receive personalized spiritual guidance based on your recurring
              themes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
