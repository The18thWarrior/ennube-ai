"use client"

import * as React from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "#/components/ui/button"
import { useTheme } from "./theme-provider"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  // Avoid reading client-only values during server render to prevent
  // hydration mismatches. We'll only apply theme-dependent attributes
  // after the component mounts on the client.
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const getVariant = (value: 'dark' | 'light' | 'system') => (mounted && theme === value ? 'highlight' : 'outline')
  const getAriaPressed = (value: 'dark' | 'light' | 'system') => (mounted ? theme === value : undefined)
  const updateTheme = (_theme: 'dark' | 'light' | 'system') => {
    console.log('update theme pressed', _theme);
    setTheme(_theme)
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={getVariant('light')}
        size="sm"
        onClick={() => updateTheme('light')}
        aria-pressed={getAriaPressed('light')}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={getVariant('dark')}
        size="sm"
        onClick={() => updateTheme('dark')}
        aria-pressed={getAriaPressed('dark')}
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={getVariant('system')}
        size="sm"
        onClick={() => updateTheme('system')}
        aria-pressed={getAriaPressed('system')}
      >
        Auto
      </Button>
    </div>
  )
}
