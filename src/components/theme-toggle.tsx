"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon-sm" className="h-8 w-8 rounded-md border-border/50">
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark" || theme === "dark"

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="h-8 w-8 rounded-md border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
