'use client'

import React, { useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '../theme-provider';
import styles from './chat-container.module.css';
import { z } from 'zod';
import { ComponentConfigSchema } from '../custom-response';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIDataTypes, UIMessage, UITools } from 'ai';
import { renderMessage } from './chat-message';
import { useMessageHistory } from '@/hooks/useMessageHistory';
import {avatarOptions, AgentSelector} from '@/components/chat/agents';
import NameComponent from './chat-name';
import MarkdownEditor from './overtype-input';

/**
 * Simple chat container using n8n/chat (embed mode)
 * *
 **/
type CustomResponseType = z.infer<typeof ComponentConfigSchema>;


const ChatContainer = ({
  id,
  initialMessages,
  name,
  agent,
}: { id?: string | undefined; initialMessages?: UIMessage[]; name?: string | null; agent?: string | null }) => {
    const { theme } = useTheme();
    const [input, handleInputChange] = React.useState('');
    const { data: session } = useSession();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const setThreadTimerRef = useRef<number | null>(null);
    const [mounted, setMounted] = React.useState(false);
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [ _name, setName ] = React.useState<string>(name || '');
    const { getThread, setThread } = useMessageHistory();
    const [selectedAvatar, setSelectedAvatar] = React.useState(agent ? agent : avatarOptions[0].key);
    // Use the ai-sdk/react chat hook
    const {
        messages,
        status,
        sendMessage,
        error,
        id: threadId
    } = useChat({
        id,
        messages: initialMessages || [],   
        transport: new DefaultChatTransport({
            api: `/api/chat?agent=${selectedAvatar}`,
        }),
        
        onFinish: (message) => {},
        onError: (err) => {
            console.error('Chat error:', err);
        },
    });
    //console.log('Chat container initialized', messages, initialMessages);
    const isLoading = status === 'submitted' || status === 'streaming';
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        sendMessage({ text: input });
        handleInputChange('');
    };

    const populateName = async () => {
      const result = await fetch('/api/chat/name-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      const data = await result.json();
      if (data.name) {
        setName(data.name);
        await setThread(threadId, [], data.name || '', selectedAvatar);
      }
    };


    // Only render after mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        if (mounted) {
            //console.log(messages);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end'});
            //setThread(threadId, [...messages], _name || '');
            if (messages.length > 0 && _name.length === 0) {
              populateName(); 
            }
        }
    }, [messages.length, mounted]);
    useEffect(() => {
        if (!mounted) return;

        // Clear any existing timer so we debounce
        if (setThreadTimerRef.current) {
            clearTimeout(setThreadTimerRef.current);
            setThreadTimerRef.current = null;
        }

        // Set a new timer to call setThread after 2 seconds
        setThreadTimerRef.current = window.setTimeout(() => {
            if (messages.length > 0) {
                setThread(threadId, [...messages], _name || '', selectedAvatar);
            }
            setThreadTimerRef.current = null;
        }, 2000);

        // Cleanup on dependency change or unmount
        return () => {
            if (setThreadTimerRef.current) {
                clearTimeout(setThreadTimerRef.current);
                setThreadTimerRef.current = null;
            }
        };
    }, [messages, mounted]);
    useEffect(() => {
        if (name) setName(name);
    }, [name]);
    useEffect(() => {
        if (agent) setSelectedAvatar(agent);
    }, [agent]);
    // EditableField for name, similar to crm-record-detail-card.tsx

    const handleNameSave = async () => {
        setIsEditingName(false);
        await setThread(threadId, [], _name || '', selectedAvatar);
    };

    const updateThreadFromTool = async (updatedMessage: UIMessage) => {
       const index = messages.findIndex((msg) => msg.id === updatedMessage.id);
        if (index !== -1) {
            const newMessages = [...messages];
            newMessages[index] = updatedMessage;
            setThread(threadId, newMessages, _name || '', selectedAvatar);
        }
    };
    const Agent = avatarOptions.find(a => a.key === selectedAvatar)?.avatar;
    
    if (!theme || !mounted) return <div />;

    return (
        <div className="flex flex-col relative" >
            {/* EditableField for Name */}
            <div className={'rounded-lg border border-gray-200 dark:border-gray-700 h-[79dvh] max-h-[79dvh] overflow-auto scrollbar'} > {/*height: "calc(100vh - 240px)",*/}
                <div className="flex justify-between items-start group mb-4 p-3 border-b ">
                    {/* <svg className="mr-3 h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg> */}
                    <div className={'px-2'}>
                        <NameComponent isEditingName={isEditingName} _name={_name} setName={setName} handleNameSave={handleNameSave} setIsEditingName={setIsEditingName} />
                    </div>
                    {/* <AgentSelector selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar} /> */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded">
                        {avatarOptions.find(a => a.key === selectedAvatar)?.avatar}
                        {/* <span className="text-xs text-muted-foreground">{avatarOptions.find(a => a.key === selectedAvatar)?.label}</span> */}
                    </div>
                </div>

                <div
                    className={[
                        styles.chatContainer,
                        
                        //theme === 'dark' ? styles.dark : styles.light,
                    ].join(' ')}
                    style={{scrollbarColor: 'none'}}
                >
                    <div className={[styles.messagesArea, ''].join(' ')}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={[
                                    styles.messageRow,
                                    msg.role === 'user' ? styles.userRow : styles.botRow,
                                ].join(' ')}
                            >
                                {renderMessage(msg, idx, Agent, theme, session, updateThreadFromTool)}
                            </div>
                        ))}
                        <div ref={messagesEndRef}></div>
                    </div>
                </div>
            </div>
            <div className={`pt-2 h-[10dvh] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60  ${styles.wfill}`}>
                {error && <div className="text-red-500 mb-2">Error: {error.message}</div>}
                <MarkdownEditor
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default ChatContainer;
