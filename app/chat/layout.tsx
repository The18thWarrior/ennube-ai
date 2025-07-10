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
import { Delete, History, SquarePlus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { agents } from '@/resources/agent-defintion';
import Image from 'next/image';

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
  agents,
  onSelectAgent,
  showAgentSelect,
  setShowAgentSelect,
}: {
  threads: ThreadHistory[];
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  onDeleteAll: () => void;
  loading: boolean;
  activeThreadId?: string;
  agents: { id: number; name: string; apiName: string; description?: string, icon?:string }[];
  onSelectAgent: (agentId: string) => void;
  showAgentSelect: boolean;
  setShowAgentSelect: (show: boolean) => void;
}) {
  return (
    <SidebarProvider>
      <Sidebar className="min-h-50 border-r bg-muted/40 " variant={'inset'}>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">Chats</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto scrollbar">
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setShowAgentSelect(!showAgentSelect)}
                  disabled={loading}
                  aria-expanded={showAgentSelect}
                  aria-controls="agent-select-section"
                >
                 <SquarePlus /> New Chat
                </SidebarMenuButton>
              </SidebarMenuItem>
              { (
                <div id="agent-select-section" className={`bg-muted rounded transition-height duration-300 ease-in-out ${showAgentSelect ? 'h-auto p-2 mt-2' : 'h-0 overflow-hidden m-0 p-0'}`}>
                  {/* <div className="mb-2 text-xs font-semibold text-muted-foreground">Select an agent:</div> */}
                  <ul className="space-y-1">
                    {agents.map((agent) => (
                      <li key={agent.id} className={'my-2'}>
                        <button
                          className="w-full rounded text-left px-2 py-2 hover:bg-accent hover:bg-gray-200 dark:hover:bg-gray-900 focus:bg-accent focus:outline-none"
                          onClick={() => onSelectAgent(agent.apiName)}
                          disabled={loading}
                        >
                          <span className={'flex justify-between gap-2 mb-1'}>
                            <Image src={agent.icon || '/logo.png'} alt={agent.name} width={60} height={60} className="rounded-full " />
                            <span>
                              <span className="font-medium">{agent.name}</span>
                              {agent.description && (
                                <span className="block text-xs text-muted-foreground">{agent.description}</span>
                              )}
                            </span>
                          </span>
                          
                          
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarMenuButton
                  onClick={() => {}}
                  disabled={loading}
                  className='hover:cursor-default'
                  aria-expanded={showAgentSelect}
                  aria-controls="open-threads-section"
                >
                 <History /> Threads
            </SidebarMenuButton>
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
  const [showAgentSelect, setShowAgentSelect] = useState(true);

  // Example agents list. Replace or fetch dynamically as needed.
  const activeAgents = agents.filter(agent => !agent.comingSoon).map(agent => {
    return {
      id: agent.id,
      apiName: agent.apiName,
      name: agent.name,
      description: agent.role,
      icon: agent.image, // Fallback icon if not provided
    }
  });

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

  // Called when an agent is selected from the collapsible section
  const handleSelectAgent = (agentId: string) => {
    setShowAgentSelect(false);
    // Generate a new threadId and optionally pass agentId as a query param or state
    const newId = nanoid();
    // Example: pass agentId as query param
    router.push(`/chat/${newId}?agent=${agentId}`);
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
          onNewChat={() => setShowAgentSelect((v) => !v)}
          onDeleteThread={handleDeleteThread}
          onDeleteAll={handleDeleteAll}
          loading={loading}
          activeThreadId={activeThreadId}
          agents={activeAgents}
          onSelectAgent={handleSelectAgent}
          showAgentSelect={showAgentSelect}
          setShowAgentSelect={setShowAgentSelect}
        />
        <SidebarInset className="flex flex-col bg-lavender-chat">
          <div className="flex-1 overflow-auto">{children}</div>
        </SidebarInset>
      </div>
    </div>
  );
}
