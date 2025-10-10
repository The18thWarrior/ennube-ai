"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input, InputTextArea } from "@/components/ui/input"
import { Send } from "lucide-react"
import styles from "./chat-input.module.css"
import { useTheme } from "../theme-provider"

interface ChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export default function ChatInput({ input, handleInputChange, handleSubmit, isLoading }: ChatInputProps) {
  const {theme} = useTheme();
  // Handle Enter key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Create a fake form event to pass to handleSubmit
      const form = e.currentTarget.form;
      if (form) {
        // @ts-ignore
        handleSubmit({ ...e, target: form, currentTarget: form });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={input}
        onChange={handleInputChange}
        //onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        //rows={2}
        disabled={isLoading}
        className="flex-1 focus:border-purple-400"
      />
      <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className={`${styles.sendButton} `}>
        <Send className={`h-4 w-4 text-white`} />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  )
}
