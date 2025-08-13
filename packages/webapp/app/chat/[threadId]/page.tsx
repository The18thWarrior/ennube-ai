'use client';
//import { getThread } from '@/lib/cache/message-history';
import Chat from '@/components/chat/chat-container';
import { ToastProvider } from '@/components/ui';
import { SidebarInset } from '@/components/ui/sidebar';
import { useMessageHistory } from '@/hooks/useMessageHistory';
import { ThreadHistory } from '@/lib/cache/message-history';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ChatPage(props: { params: Promise<{ threadId: string }> }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadHistory | null>(null);
  const searchParams = useSearchParams();
  const agent = searchParams.get('agent') || undefined; // get the agent from the URL params
  const { getThread } = useMessageHistory();
  // useEffect(() => {
  //   const fetchThread = async () => {
  //     if (!threadId) return;
  //     const thread = await getThread(threadId);
  //     setThread(thread);
  //   };
  //   fetchThread();
  // }, [threadId]);

  useEffect(() => {
    const runAsync = async () => {
      const { threadId: _threadId } = await props.params; // get the chat ID from the URL
      setThreadId(_threadId);
      if (!_threadId) return;
      const thread = await getThread(_threadId, agent as 'data-steward' | 'prospect-finder' | 'contract-reader' | undefined);
      
      setThread(thread);
    };
    runAsync();
  }, [props.params]);
  if (!threadId) return null;
  return (
    
        <ToastProvider>
            <div className={'px-5'} style={{scrollbarColor: 'black'}}>
                <Chat id={threadId} initialMessages={thread?.messages || undefined} name={thread?.name} agent={thread?.currentAgent|| agent}/>
            </div>      
        </ToastProvider>
  );
}