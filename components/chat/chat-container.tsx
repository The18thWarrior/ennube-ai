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
  agent = avatarOptions[0].key,
}: { id?: string | undefined; initialMessages?: Message[]; name?: string | null; agent?: string | null } = {}) => {
    const { theme } = useTheme();
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
            console.log('onfinish', message, messages);
            //setThread(threadId, [...messages, message], _name || '');
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        },
        
        // experimental_prepareRequestBody({ messages, id }) {
        //     return { message: messages[messages.length - 1], id };
        // },
    });
    const isLoading = status === 'submitted' || status === 'streaming';

    // Only render after mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        if (mounted) {
            //console.log(messages);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            //setThread(threadId, [...messages], _name || '');
        }
    }, [messages.length, mounted]);
    useEffect(() => {
        if (mounted) {
            console.log(messages);
            if (messages.length > 0) {
                setThread(threadId, [...messages], _name || '');
            }
            //setThread(threadId, [...messages], _name || '');
        }
    }, [messages, mounted]);
    useEffect(() => {
        if (name) setName(name);
    }, [name]);
    // EditableField for name, similar to crm-record-detail-card.tsx

    const handleNameSave = async () => {
        setIsEditingName(false);
        await setThread(threadId, [], _name || '');
    };

    if (!theme || !mounted) return <div />;

    return (
        <div>
            {/* EditableField for Name */}
            <div className="flex justify-between items-start group mb-4 ml-6">
                {/* <svg className="mr-3 h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg> */}
                <NameComponent isEditingName={isEditingName} _name={_name} setName={setName} handleNameSave={handleNameSave} setIsEditingName={setIsEditingName} />
                <AgentSelector selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar} />
            </div>

            <div
                className={[
                    styles.chatContainer,
                    //theme === 'dark' ? styles.dark : styles.light,
                ].join(' ')}
            >
                <div className={styles.messagesArea}>
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={[
                                styles.messageRow,
                                msg.role === 'user' ? styles.userRow : styles.botRow,
                            ].join(' ')}
                        >
                            {renderMessage(msg, idx, theme)}
                        </div>
                    ))}
                    <div ref={messagesEndRef}></div>
                </div>
            </div>

            <div className={`p-4 md:p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed bottom-0 ${styles.wfill}`}>
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
