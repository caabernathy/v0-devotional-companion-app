"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Sparkles, Loader2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Journal {
  id: string
  user_id: string
  title: string | null
  content: string
  tags: string[]
  word_count: number
  created_at: string
  updated_at: string
}

interface JournalInterfaceProps {
  userId: string
  journals: Journal[]
}

export function JournalInterface({ userId, journals: initialJournals }: JournalInterfaceProps) {
  const [journals, setJournals] = useState<Journal[]>(initialJournals)
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(initialJournals[0]?.id || null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const supabase = createClient()

  // Load journal when selection changes
  useEffect(() => {
    if (currentJournalId) {
      const journal = journals.find((j) => j.id === currentJournalId)
      if (journal) {
        setTitle(journal.title || "")
        setContent(journal.content)
        setTags(journal.tags)
      }
    }
  }, [currentJournalId, journals])

  // Update word count
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    setWordCount(words.length)
  }, [content])

  // Auto-save every 3 seconds
  useEffect(() => {
    if (!currentJournalId || !content) return

    const timer = setTimeout(() => {
      handleSave()
    }, 3000)

    return () => clearTimeout(timer)
  }, [content, title, tags, currentJournalId])

  const createNewJournal = async () => {
    const { data, error } = await supabase
      .from("journals")
      .insert({
        user_id: userId,
        title: "Untitled Entry",
        content: "",
        tags: [],
        word_count: 0,
      })
      .select()
      .single()

    if (data && !error) {
      setJournals([data, ...journals])
      setCurrentJournalId(data.id)
      setTitle("")
      setContent("")
      setTags([])
    }
  }

  const handleSave = async () => {
    if (!currentJournalId) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("journals")
        .update({
          title: title || "Untitled Entry",
          content,
          tags,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentJournalId)

      if (!error) {
        // Update local state
        setJournals((prev) =>
          prev.map((j) =>
            j.id === currentJournalId
              ? { ...j, title: title || "Untitled Entry", content, tags, word_count: wordCount }
              : j,
          ),
        )
      }
    } catch (error) {
      console.error("[v0] Error saving journal:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentJournalId || !confirm("Are you sure you want to delete this journal entry?")) return

    const { error } = await supabase.from("journals").delete().eq("id", currentJournalId)

    if (!error) {
      const newJournals = journals.filter((j) => j.id !== currentJournalId)
      setJournals(newJournals)
      setCurrentJournalId(newJournals[0]?.id || null)
      setTitle("")
      setContent("")
      setTags([])
    }
  }

  const generatePrompt = async () => {
    setIsGeneratingPrompt(true)
    try {
      const response = await fetch("/api/journal/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error("Failed to generate prompt")

      const data = await response.json()

      if (data?.prompt) {
        setContent((prev) => (prev ? `${prev}\n\n${data.prompt}` : data.prompt))
      }
    } catch (error) {
      console.error("[v0] Error generating prompt:", error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        {/* Journal List Sidebar */}
        <Card className="border-border/50 shadow-sm h-[calc(100vh-12rem)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Journal Entries</CardTitle>
              <Button size="icon" variant="ghost" onClick={createNewJournal}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1 p-4 pt-0">
                {journals.map((journal) => (
                  <button
                    key={journal.id}
                    onClick={() => setCurrentJournalId(journal.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      currentJournalId === journal.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="text-sm font-medium truncate">{journal.title || "Untitled Entry"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(journal.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
                {journals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No entries yet</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Journal Editor */}
        <Card className="border-border/50 shadow-sm h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Journal Entry</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{wordCount} words</span>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Button size="sm" variant="outline" onClick={generatePrompt} disabled={isGeneratingPrompt}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingPrompt ? "Generating..." : "Prompt"}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!currentJournalId}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={!currentJournalId}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 p-4">
            {!currentJournalId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Create a new journal entry to begin</p>
                  <Button onClick={createNewJournal}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Entry
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry title..."
                  className="text-lg font-semibold"
                />
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts, prayers, and reflections..."
                  className="flex-1 resize-none font-mono text-sm leading-relaxed"
                />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="Add tags..."
                      className="text-sm"
                    />
                    <Button size="sm" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
