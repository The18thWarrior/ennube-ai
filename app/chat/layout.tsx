'use client'
import React, { useEffect, useState } from 'react';
import { useMessageHistory } from '../../hooks/useMessageHistory';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarSeparator,
  SidebarInset,
} from '../../components/ui/sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { Delete, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

// ThreadHistory type from lib/cache/message-history
type Message = {
  id: string;
  role: string;
  content: string;
  [key: string]: any;
};
type ThreadHistory = {
  threadId: string;
  messages: Message[];
  lastUpdated: number;
  name: string | null;
};

function ChatSidebar({
  threads,
  onNewChat,
  onDeleteThread,
  onDeleteAll,
  loading,
  activeThreadId,
}: {
  threads: ThreadHistory[];
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  onDeleteAll: () => void;
  loading: boolean;
  activeThreadId?: string;
}) {
  return (
    <SidebarProvider>
      <Sidebar className="min-h-50 border-r bg-muted/40" variant={'inset'}>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">Chats</span>
            <button
              className="ml-2 rounded bg-primary px-2 py-1 text-xs text-white dark:text-black hover:bg-primary/80"
              onClick={onNewChat}
              aria-label="New Chat"
              disabled={loading}
            >
              + New
            </button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Threads</SidebarGroupLabel>
            <SidebarMenu>
              {threads.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground">No chats yet.</div>
              )}
              {threads.map((thread) => (
                <SidebarMenuItem key={thread.threadId}>
                  <SidebarMenuButton
                    isActive={thread.threadId === activeThreadId}
                    onClick={() => {
                      if (thread.threadId !== activeThreadId) {
                        window.location.href = `/chat/${thread.threadId}`;
                      }
                    }}
                  >
                    <span className="truncate flex-1">
                      {thread.name || thread.messages[0]?.content?.slice(0, 30) || 'Untitled'}
                    </span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    aria-label="Delete Chat"
                    onClick={() => onDeleteThread(thread.threadId)}
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <button
            className="w-full rounded bg-destructive px-2 py-1 text-xs text-white hover:bg-destructive/80"
            onClick={onDeleteAll}
            disabled={loading || threads.length === 0}
            aria-label="Delete All Chats"
          >
            Delete All
          </button>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    getAll,
    deleteAll,
    deleteThread,
  } = useMessageHistory();
  const [threads, setThreads] = useState<ThreadHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract threadId from pathname: /chat/[threadId]
  const activeThreadId = pathname?.split('/').length === 3 ? pathname.split('/')[2] : undefined;

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const data = await getAll();
      setThreads(Array.isArray(data) ? data : []);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    // Optionally, add polling or subscribe to updates
  }, []);

  const handleNewChat = () => {
    // Generate a new threadId (could use uuid or timestamp)
    const newId = nanoid();
    router.push(`/chat/${newId}`);
  };

  const handleDeleteThread = async (threadId: string) => {
    setLoading(true);
    try {
      await deleteThread(threadId);
      await fetchThreads();
      // If the deleted thread is active, redirect to /chat
      if (threadId === activeThreadId) {
        router.push('/chat');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      await deleteAll();
      await fetchThreads();
      router.push('/chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
        <div className="flex">
        <ChatSidebar
            threads={threads}
            onNewChat={handleNewChat}
            onDeleteThread={handleDeleteThread}
            onDeleteAll={handleDeleteAll}
            loading={loading}
            activeThreadId={activeThreadId}
        />
        <SidebarInset className="flex flex-col bg-lavender-chat">
            <div className="flex-1 overflow-auto">{children}</div>
        </SidebarInset>
        
        </div>
    </div>
  );
}
