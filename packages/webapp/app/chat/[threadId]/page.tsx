'use client';
//import { getThread } from '@/lib/cache/message-history';
import Chat from '@/components/chat/chat-container';
import { ToastProvider } from '@/components/ui';
import { SidebarInset } from '@/components/ui/sidebar';
import { useMessageHistory } from '@/hooks/useMessageHistory';
import { ThreadHistory } from '@/lib/cache/message-history';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { set } from 'zod/v4';

export default function ChatPage(props: { params: Promise<{ threadId: string }> }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [hasThreadLoaded, setHasThreadLoaded] = useState(false);
  const [thread, setThread] = useState<ThreadHistory | null>(null);
  const searchParams = useSearchParams();
  const agent = searchParams.get('agent') || undefined; // get the agent from the URL params
  const { getThread } = useMessageHistory();
  const runAsync = async () => {
      setHasThreadLoaded(false);
      const { threadId: _threadId } = await props.params; // get the chat ID from the URL
      setThreadId(_threadId);
      if (!_threadId) {
        setHasThreadLoaded(true);
        return
      }
      const thread = await getThread(_threadId, agent as 'data-steward' | 'prospect-finder' | 'contract-reader' | undefined);
      
      setThread(thread);
      setHasThreadLoaded(true);
  };
  useEffect(() => {
    
    runAsync();
  }, []);
  if (!threadId) return null;
  return (
    
        <ToastProvider>
            <div className={'px-5'} style={{scrollbarColor: 'black'}}>
                {hasThreadLoaded && 
                  <Chat id={threadId} initialMessages={thread?.messages || undefined} name={thread?.name} agent={thread?.currentAgent|| agent} reload={runAsync}/>
                }
            </div>      
        </ToastProvider>
  );
}