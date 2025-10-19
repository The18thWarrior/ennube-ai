// === app/help/page.tsx ===
// Created: 2025-01-19
// Purpose: Help chat interface for customer support interactions
// Exports:
//   - default export: HelpPage component
// Interactions:
//   - Uses /api/chat/help endpoint
//   - Leverages ai-elements components for UI
// Notes:
//   - No persistent memory (thread storage)
//   - No file upload support
//   - Simple, stateless customer support chat

'use client';

import React, { useRef, useEffect, ChangeEventHandler } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, FileUIPart, UIMessage } from 'ai';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PromptInput, 
  PromptInputBody, 
  PromptInputTextarea, 
  PromptInputToolbar, 
  PromptInputTools, 
  PromptInputSubmit,
  PromptInputMessage
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import { Bot, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useUser } from '@auth0/nextjs-auth0';
import { cn } from '@/lib/utils';

import styles from '@/components/chat/chat-container.module.css';

/**
 * OVERVIEW
 *
 * Purpose: Provides a simple help chat interface for customer support
 * Assumptions:
 *   - User is authenticated (handled by middleware)
 *   - No persistent chat history needed
 *   - No file upload capability required
 * Edge Cases:
 *   - Handles empty messages gracefully
 *   - Auto-scrolls to latest message
 * How it fits into the system:
 *   - Standalone help page accessible via /help route
 *   - Uses standardized AI elements components
 *   - Calls /api/chat/help endpoint for responses
 * Future Improvements:
 *   - Add typing indicators
 *   - Add conversation reset button
 *   - Add copy message functionality
 */

const documentationFilePart = {
    filename: 'documentation.txt',
    url: `https://drive.google.com/file/d/1Jy7-HhWr9WhIAejckYpicC5j2omvLzHq/view?usp=sharing`,
    mediaType: 'text/plain',
    type: 'file'
} as FileUIPart;

export default function HelpPage() {
  const { theme } = useTheme();
  const [input, setInput] = React.useState('');
  const [mounted, setMounted] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {user} = useUser();

  // Use the ai-sdk/react chat hook without persistent storage
  const {
    messages,
    status,
    sendMessage,
    error,
  } = useChat({
    // No id = no persistence
    transport: new DefaultChatTransport({
      api: '/api/chat/help',
      prepareSendMessagesRequest: ({ messages }) => {
        // Strip out any file parts since help chat doesn't support uploads
        const userMessage = messages.at(-1);
        if (!userMessage) {
          throw new Error('No user message found');
        }
        userMessage.parts = [...userMessage.parts, documentationFilePart];
        //const enhancedMessages = [...messages, documentationFilePart]
        // DefaultChatTransport expects an object with a `body` property for the request payload
        return { body: { messages } };
      }
    }),
    onFinish: (message) => {
      console.log('Help chat response received');
    },
    onError: (err) => {
      console.error('Help chat error:', err);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Handle form submission
  const handleSubmitPromptInput = (message: PromptInputMessage, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.text || message.text.trim().length === 0) return;
    
    // Send message without files (help chat doesn't support file upload)
    sendMessage({ text: message.text });
    setInput('');
  };

  // Handle textarea input changes
  const handlePromptInputChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    setInput(event.target.value);
  };

  // Only render after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (mounted && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end', 
        inline: 'end'
      });
    }
  }, [messages.length, mounted]);

  if (!mounted) return <div />;

  return (
    <div className="flex flex-col h-[90vh] max-w-4xl mx-auto p-4">
      {/* Header */}
      {messages.length === 0 && (
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">Ennube.ai Help & Support</h1>
          <p className="text-muted-foreground">
            Ask questions about features, integrations, troubleshooting, or anything else. I'm here to help!
          </p>
        </div>
      )}
      {/* Messages Container */}
      <Card className="flex-1 mb-4 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Welcome to Ennube.ai Support!</p>
              <p className="text-sm mt-2 max-w-md">
                I'm your friendly Agent Handler. Ask me anything about our AI Agents, 
                integrations, billing, or troubleshooting. Let's get your agents back on track!
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={[styles.messageRow , msg.role === 'user' ? styles.userRow : styles.botRow].join(' ')}>
              <div  className="flex items-start gap-3">
                {/* Avatar */}
                {msg.role === 'assistant' ? (
                  <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex aspect-square size-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 mt-2 ">
                  </div>
                )}

                {/* Message Content */}
                <Card className={cn("mx-2", msg.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground", "")}>
                  <CardContent className="px-4 py-3">
                    {msg.parts?.map((part, partIdx) => {
                      if (part.type === 'text') {
                        return <Response key={partIdx}>{part.text}</Response>;
                      }
                      return null;
                    })}
                  </CardContent>
                </Card>
                {msg.role === 'user' ? (
                  <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-secondary flex-shrink-0">
                    {user?.picture ? (
                        <img height={35} width={35} className={"border rounded-full"}
                                src={user?.picture ||
                                `/logo.png`
                                }
                                alt={user?.name ?? "User"}
                            />
                      ) : <UserIcon className="h-5 w-5" />
                    }
                  </div>
                ) : (
                  <div className="flex aspect-square size-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 mt-2 ">
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground flex-shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <Card className="bg-destructive/10 border-destructive">
                <CardContent className="px-4 py-3 text-destructive">
                  <p className="font-medium">Oops! Something went wrong.</p>
                  <p className="text-sm mt-1">{error.message}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>
      </Card>

      {/* Input Area */}
      <div className="flex-none">
        <PromptInput
          onSubmit={handleSubmitPromptInput}
          className="w-full"
        >
          <PromptInputBody className="flex flex-row">
            <PromptInputTextarea 
              onChange={handlePromptInputChange} 
              value={input}
              placeholder="Ask me anything about Ennube.ai..."
              disabled={isLoading}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              {/* No additional tools needed for help chat */}
            </PromptInputTools>
            <PromptInputSubmit
              disabled={isLoading || !input.trim()}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}

/*
 * === app/help/page.tsx ===
 * Updated: 2025-01-19
 * Summary: Customer support help chat interface
 * Key Components:
 *   - HelpPage: Main chat container with message display and input
 *   - Uses AI SDK's useChat hook for message streaming
 *   - Leverages ai-elements components for consistent UI
 * Dependencies:
 *   - Requires: @ai-sdk/react, ai-elements components
 *   - Calls: /api/chat/help endpoint
 * Version History:
 *   v1.0 – initial implementation with basic chat interface
 * Notes:
 *   - No persistent memory (no thread ID passed)
 *   - File uploads disabled (not included in PromptInput)
 *   - Auto-scrolls to latest messages
 *   - Responsive layout with max-width constraint
 */
