"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Heart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Devotional {
  id: string
  date: string
  verse_reference: string
  verse_text: string
  reflection: string
  prayer_points: string[]
  themes: string[]
}

interface DailyDevotionalProps {
  devotional: Devotional | null
}

export function DailyDevotional({ devotional }: DailyDevotionalProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateNew = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/devotional/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: new Date().toISOString().split("T")[0] }),
      })

      if (!response.ok) throw new Error("Failed to generate devotional")

      const data = await response.json()

      if (data) {
        await fetch("/api/themes/update", { method: "POST" })
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to generate devotional:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!devotional) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">No devotional for today</CardTitle>
            <CardDescription>Generate today&apos;s devotional to begin your spiritual journey</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleGenerateNew} disabled={isGenerating} size="lg">
              {isGenerating ? "Generating..." : "Generate Today's Devotional"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formattedDate = new Date(devotional.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Today&apos;s Devotional</h2>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>

      {/* Verse Card */}
      <Card className="border-border/50 shadow-sm bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">{devotional.verse_reference}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <blockquote className="border-l-4 border-primary pl-4 italic text-lg text-foreground">
            {devotional.verse_text}
          </blockquote>
        </CardContent>
      </Card>

      {/* Reflection Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Reflection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-foreground">{devotional.reflection}</p>
        </CardContent>
      </Card>

      {/* Prayer Points Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Prayer Points</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {devotional.prayer_points.map((point, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-primary font-semibold">{index + 1}.</span>
                <span className="text-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Themes */}
      <div className="flex flex-wrap gap-2 justify-center">
        {devotional.themes.map((theme) => (
          <Badge key={theme} variant="secondary" className="text-sm">
            {theme}
          </Badge>
        ))}
      </div>
    </div>
  )
}
