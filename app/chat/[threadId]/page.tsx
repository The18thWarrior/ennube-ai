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
  const { getThread } = useMessageHistory();
  const [thread, setThread] = useState<ThreadHistory | null>(null);
  const searchParams = useSearchParams();
  const agent = searchParams.get('agent') || undefined; // get the agent from the URL params
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
      const thread = await getThread(_threadId);
      setThread(thread);
    };
    runAsync();
  }, [props.params]);
  if (!threadId) return null;
  return (
    
        <ToastProvider>
            <div className={'px-8 mb-8'}>
                <Chat id={threadId} initialMessages={thread?.messages || undefined} name={thread?.name} agent={agent}/>
            </div>      
        </ToastProvider>
  );
}