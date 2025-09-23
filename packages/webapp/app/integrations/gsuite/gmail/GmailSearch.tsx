"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface EmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages?: EmailMessage[];
}

interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  body: {
    text?: string;
    html?: string;
  };
  date: Date;
  attachments?: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
}

export default function GmailSearch() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);

  const searchEmails = async () => {
    if (!query) return;

    setIsLoading(true);
    setError(null);
    setSelectedThread(null);

    try {
      const response = await fetch(`/api/gsuite/gmail/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Error searching emails: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.threads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while searching emails");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const viewThread = async (threadId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gsuite/gmail/thread/${threadId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching thread: ${response.status}`);
      }

      const data = await response.json();
      setSelectedThread(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching thread");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (email: string) => {
    const name = email.split('@')[0].split('.').join(' ');
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          placeholder="Search emails..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchEmails()}
        />
        <Button onClick={searchEmails} disabled={isLoading || !query}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Results */}
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-lg font-medium">Results</h2>
          {searchResults.length === 0 && !isLoading ? (
            <p className="text-muted-foreground text-sm">No results to show</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {searchResults.map((thread) => (
                <Card 
                  key={thread.id}
                  className={`cursor-pointer hover:bg-muted  transition-colors ${
                    selectedThread?.id === thread.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => viewThread(thread.id)}
                >
                  <CardContent className="p-3">
                    <p className="text-sm truncate">{thread.snippet}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Email Thread View */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-medium mb-2">Email Thread</h2>
          {selectedThread ? (
            <div className="border rounded-lg p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {selectedThread.messages?.map((message) => (
                <Card key={message.id} className="overflow-hidden">
                  <CardHeader className="p-3 bg-muted ">
                    <div className="flex gap-3 items-start">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(message.from)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{message.from}</CardTitle>
                          <span className="text-xs text-muted-foreground">{formatDate(message.date.toString())}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">To: {message.to.join(', ')}</p>
                        <p className="font-medium">{message.subject}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {message.body.html ? (
                      <div dangerouslySetInnerHTML={{ __html: message.body.html }} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.body.text}</p>
                    )}
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.attachments.map((attachment) => (
                            <Badge key={attachment.id} variant="outline" className="flex items-center gap-1 p-1">
                              <Paperclip className="h-3 w-3" />
                              {attachment.filename}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Button className="mt-4 w-full">
                <Send className="h-4 w-4 mr-2" />
                Reply
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg p-6 text-center text-muted-foreground">
              Select an email thread to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
