import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, MessageSquare, PenLine } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Devotional Companion</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Deepen your faith through daily reflection
            </h2>
            <p className="text-pretty text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Experience meaningful spiritual growth with daily devotionals, guided journaling, and AI-powered
              conversations that help you explore your faith journey.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-base gap-2">
              <Link href="/auth/sign-up">
                Begin your journey
                <span className="sr-only">Create an account to start</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base gap-2 bg-transparent">
              <Link href="/auth/login">
                Sign in
                <span className="sr-only">Sign in to your account</span>
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid gap-6 pt-12 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Daily Devotionals</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-generated devotionals with scripture, reflection, and prayer points
              </p>
            </div>
            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Spiritual Companion</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chat with an AI companion for guidance on faith and scripture
              </p>
            </div>
            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <PenLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Reflective Journaling</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Document your spiritual journey with guided prompts and insights
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-border/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built with faith and purpose</p>
        </div>
      </footer>
    </div>
  )
}
