'use client'

import React, { useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '../theme-provider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import styles from './chat-container.module.css';
import { getJsonData, isJson, parseAndValidateResponse } from '@/lib/utils';
import { z } from 'zod';
import { ComponentConfigSchema } from '../custom-response';
import { JsonView } from '@/components/ui/json-view';
import CustomResponse from '@/components/custom-response';
import { useChat } from '@ai-sdk/react';
import { UIMessage, Message } from 'ai';
import { nanoid } from 'nanoid';
import ChatInput from './chat-input';
import error from 'next/error';
import { renderMessage } from './chat-message';
import { useMessageHistory } from '@/hooks/useMessageHistory';
import {avatarOptions, AgentSelector} from '@/components/chat/agents';
import NameComponent from './chat-name';

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
}: { id?: string | undefined; initialMessages?: Message[]; name?: string | null; agent?: string | null } = {}) => {
    const { theme } = useTheme();
    const { data: session } = useSession();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = React.useState(false);
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [ _name, setName ] = React.useState<string>("");
    const { getThread, setThread } = useMessageHistory();
    const [selectedAvatar, setSelectedAvatar] = React.useState(agent ? agent : avatarOptions[0].key);
    // Use the ai-sdk/react chat hook
    const {
        messages,
        input,
        setInput,
        status,
        handleInputChange,
        handleSubmit,
        append,
        error,
        id: threadId
    } = useChat({
        id,
        initialMessages: initialMessages || [],        
        api: `/api/chat?agent=${selectedAvatar}`,
        onFinish: (message) => {
            //console.log('onfinish', message, messages);
            
            //setThread(threadId, [...messages, message], _name || '');
            setTimeout(() => {
                setThread(threadId, [...messages], _name || '', selectedAvatar);
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100);
        },
        
        // experimental_prepareRequestBody({ messages, id }) {
        //     return { message: messages[messages.length - 1], id };
        // },
    });
    console.log(messages);
    const isLoading = status === 'submitted' || status === 'streaming';

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
        }
    }, [messages.length, mounted]);
    useEffect(() => {
        if (mounted) {
            if (messages.length > 0) {
                //setThread(threadId, [...messages], _name || '', selectedAvatar);
            }
            //setThread(threadId, [...messages], _name || '');
        }
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

    const Agent = avatarOptions.find(a => a.key === selectedAvatar)?.avatar;
    
    if (!theme || !mounted) return <div />;

    return (
        <div className="flex flex-col relative" >
            {/* EditableField for Name */}
            <div className={'rounded-lg border border-gray-200 dark:border-gray-700 min-h-[80dvh] mb-15 scrollbar'} > {/*height: "calc(100vh - 240px)",*/}
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
                    <div className={[styles.messagesArea, 'mb-16'].join(' ')}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={[
                                    styles.messageRow,
                                    msg.role === 'user' ? styles.userRow : styles.botRow,
                                ].join(' ')}
                            >
                                {renderMessage(msg, idx, Agent, theme, session)}
                            </div>
                        ))}
                        <div ref={messagesEndRef}></div>
                    </div>
                </div>
            </div>
            <div className={`py-4 pr-6 h-[10dvh] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed bottom-0 ${styles.wfill}`}>
                {error && <div className="text-red-500 mb-2">Error: {error.message}</div>}
                <ChatInput
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
