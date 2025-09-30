"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, BookOpen, PenLine, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Devotional Companion</h1>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
            <Button asChild variant={isActive("/dashboard") ? "secondary" : "ghost"} size="sm" className="gap-2">
              <Link href="/dashboard">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Devotional</span>
                <span className="sr-only">View daily devotional</span>
              </Link>
            </Button>
            <Button asChild variant={isActive("/chat") ? "secondary" : "ghost"} size="sm" className="gap-2">
              <Link href="/chat">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
                <span className="sr-only">Open spiritual companion chat</span>
              </Link>
            </Button>
            <Button asChild variant={isActive("/journal") ? "secondary" : "ghost"} size="sm" className="gap-2">
              <Link href="/journal">
                <PenLine className="h-4 w-4" />
                <span className="hidden sm:inline">Journal</span>
                <span className="sr-only">Write in journal</span>
              </Link>
            </Button>
          </nav>
          <div className="ml-2 h-6 w-px bg-border" aria-hidden="true" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
            aria-label="Sign out of your account"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
