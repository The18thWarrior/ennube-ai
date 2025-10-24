'use client'

import React, { useRef, useEffect, ChangeEventHandler } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
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
import { PromptInput, PromptInputBody, PromptInputAttachments, PromptInputAttachment, PromptInputTextarea, PromptInputToolbar, PromptInputTools, PromptInputActionMenu, PromptInputActionMenuTrigger, PromptInputActionMenuContent, PromptInputActionAddAttachments, PromptInputSubmit, PromptInputMessage, PromptInputButton } from '../ai-elements/prompt-input';
import { Card, Button } from '../ui';
import { GlobeIcon, Download } from 'lucide-react';
import { OnboardingStatusProvider } from '@/hooks/useOnboardingStatus';

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
  reload
}: { id?: string | undefined; initialMessages?: UIMessage[]; name?: string | null; agent?: string | null; reload: () => void }) => {
    const { theme } = useTheme();
    const [input, handleInputChange] = React.useState('');
    const { user } = useUser();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const setThreadTimerRef = useRef<number | null>(null);
    const [mounted, setMounted] = React.useState(false);
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [ _name, setName ] = React.useState<string>(name || '');
    const { getThread, setThread } = useMessageHistory();
    const [selectedAvatar, setSelectedAvatar] = React.useState(agent ? agent : avatarOptions[0].key);
    
    const [webSearch, setWebSearch] = React.useState(false);
    // Use the ai-sdk/react chat hook
    const {
        messages,
        status,
        sendMessage,
        setMessages,
        error,
        id: threadId,
        stop
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
    console.log(messages);
    //console.log('Chat container initialized', messages, initialMessages);
    const isLoading = status === 'submitted' || status === 'streaming';

    const handleSubmitPromptInput = (message: PromptInputMessage, event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!message.text || message.text.trim().length === 0) return;
      sendMessage({ text: message.text, files: message.files },{ body: { webSearch } });
      handleInputChange('');
    }

    const handlePromptInputChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
      handleInputChange(event.target.value);
    }    

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

    const handleStop = () => {
        if (isLoading) {
            stop();
        }
    }

    const handleDownloadHistory = () => {
        // Create the export object with message history and metadata
        const exportData = {
            metadata: {
                threadId,
                threadName: _name,
                agent: selectedAvatar,
                exportedAt: new Date().toISOString(),
                messageCount: messages.length,
            },
            messages: messages.map((msg) => ({
                id: msg.id,
                role: msg.role,
                parts: msg.parts,
            })),
        };

        // Convert to JSON string with pretty printing
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create a Blob from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a temporary URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-history-${_name.replaceAll(' ', '_') || 'export'}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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

    const updateThreadFromTool = async (updatedMessage: UIMessage, resultMessage: UIMessage | undefined = undefined) => {
       const index = messages.findIndex((msg) => msg.id === updatedMessage.id);
        if (index !== -1) {
            const newMessages = [...messages];
            newMessages[index] = updatedMessage;
            if (resultMessage) {
              await setThread(threadId, [...newMessages, resultMessage], _name || '', selectedAvatar);
              await setMessages([...newMessages, resultMessage]);
            } else {
              await setThread(threadId, newMessages, _name || '', selectedAvatar);
            }
        }
        //reload();
    };
    const Agent = avatarOptions.find(a => a.key === selectedAvatar)?.avatar;
    
    if (!theme || !mounted) return <div />;

    return (
      <OnboardingStatusProvider>
        <div className="flex flex-col relative mr-6" >
            <Card className={'rounded-lg border grow h-[75dvh] max-h-[75dvh] overflow-auto scrollbar'} > {/*height: "calc(100vh - 240px)",*/}
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
                        'overflow-hidden relative'
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
                                {renderMessage(msg, idx, Agent, theme, user, updateThreadFromTool, user?.sub, selectedAvatar)}
                            </div>
                        ))}
                        <div ref={messagesEndRef}></div>
                    </div>
                </div>
            </Card>
            <div className={`h-[10dvh] flex-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
                {error && <div className="text-red-500 mb-2">Error: {error.message}</div>}
                <PromptInput
                  globalDrop={true}
                  onSubmit={handleSubmitPromptInput}
                  className="mt-4 relative"
                  accept="text/comma-separated-values,text/csv,application/csv,application/vnd.ms-excel,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                >
                  <PromptInputBody className={'flex flex-row'}>
                    <PromptInputTextarea onChange={handlePromptInputChange} value={input} />
                  </PromptInputBody>
                  <PromptInputToolbar>
                    <PromptInputTools>
                      <PromptInputActionMenu>
                        <PromptInputActionMenuTrigger />
                        <PromptInputActionMenuContent>
                          <PromptInputActionAddAttachments />
                        </PromptInputActionMenuContent>
                      </PromptInputActionMenu>
                      <PromptInputButton
                        variant={webSearch ? 'default' : 'ghost'}
                        onClick={() => {
                          console.log(`Web search toggled, old value: ${webSearch} new value: ${!webSearch}`);
                          setWebSearch(!webSearch)
                        }}
                      >
                        <GlobeIcon size={16} />
                        <span>Search</span>
                      </PromptInputButton>
                      <PromptInputAttachments>
                      {(attachment) => (
                        <PromptInputAttachment data={attachment} />
                      )}
                      </PromptInputAttachments>
                    </PromptInputTools>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={handleDownloadHistory} >
                        <Download size={16} />
                      </Button>
                      <PromptInputSubmit
                        disabled={isLoading}
                        status={'ready'}
                      />
                    </div>
                    
                  </PromptInputToolbar>
                </PromptInput>
            </div>
        </div>
      </OnboardingStatusProvider>
    );
};

export default ChatContainer;
