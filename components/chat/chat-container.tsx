'use client'

import React, { useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '../theme-provider';
import styles from './chat-container.module.css';
import { getJsonData, isJson, parseAndValidateResponse } from '@/lib/utils';
import { z } from 'zod';
import { ComponentConfigSchema } from '../custom-response';
import { JsonView } from '@/components/ui/json-view';
import CustomResponse from '@/components/custom-response';
import { useChat } from '@ai-sdk/react';
import { UIMessage } from 'ai';
import { nanoid } from 'nanoid';

/**
 * Simple chat container using n8n/chat (embed mode)
 * *
 **/
type CustomResponseType = z.infer<typeof ComponentConfigSchema>;


const ChatContainer = () => {
    const { theme } = useTheme();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = React.useState(false);

    // Use the ai-sdk/react chat hook
    const {
        messages,
        input,
        setInput,
        status,
        handleInputChange,
        handleSubmit,
        append,
    } = useChat({
        api: '/api/chat/data-steward',
        onFinish: () => {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        },
    });
    const isLoading = status === 'submitted' || status === 'streaming';

    // Only render after mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        if (mounted) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, mounted]);

    // Custom message rendering
    const renderMessage = (msg: UIMessage, idx: number) => {
        //console.log(msg);
        // If the message is from the user, always render as text
        if (msg.role === 'user') {
            return DefaultMessageComponent(msg);
        }

        // Try to parse the message for custom-ui or json
        if (isJson(msg.content)) {
            if (parseAndValidateResponse(msg.content, ComponentConfigSchema)) {
                return (
                    
                    <span
                        className={[
                            styles.messageBubble,
                            styles.botBubble,
                            theme === 'dark' ? styles.darkBubble : styles.lightBubble,
                        ].join(' ')}
                        style={{ padding: 0, background: 'none', border: 'none' }}
                    >
                        {RenderHtmlComponent(<CustomResponse config={getJsonData(msg.content)} />, msg)}
                    </span>
                );
            }
            const jsonData = getJsonData(msg.content);
            if (jsonData && parseAndValidateResponse(jsonData.data, ComponentConfigSchema)) {
                return (
                    <span
                        className={[
                            styles.messageBubble,
                            styles.botBubble,
                            theme === 'dark' ? styles.darkBubble : styles.lightBubble,
                        ].join(' ')}
                        style={{ padding: 0, background: 'none', border: 'none' }}
                    >
                        {RenderHtmlComponent(<CustomResponse config={jsonData.data} />, msg)}
                    </span>
                );
            }
            if (jsonData) {
                return (
                    <span
                        className={[
                            styles.messageBubble,
                            styles.botBubble,
                            theme === 'dark' ? styles.darkBubble : styles.lightBubble,
                        ].join(' ')}
                        style={{ padding: 0, background: 'none', border: 'none' }}
                    >
                        {RenderHtmlComponent( MessageComponentWrapper(<JsonView data={jsonData} />, msg.role), msg)}
                    </span>
                );
            }

            return (
                <span
                    className={[
                        styles.messageBubble,
                        styles.botBubble,
                        theme === 'dark' ? styles.darkBubble : styles.lightBubble,
                    ].join(' ')}
                    style={{ padding: 0, background: 'none', border: 'none' }}
                >
                    {RenderHtmlComponent( MessageComponentWrapper(<JsonView data={jsonData} />, msg.role), msg)}
                </span>
            );
            
        }

        // Default: render as text
        return RenderHtmlComponent(DefaultMessageComponent(msg), msg);
    };

    const DefaultMessageComponent = (msg: UIMessage) => {
        return MessageComponentWrapper(<span>{msg.content}</span>, msg.role);
    };

    const MessageComponentWrapper = (Component: React.ReactElement, role:string) => (
        <span
            className={[
                styles.messageBubble,
                role === 'user' ? styles.userBubble : styles.botBubble,
                theme === 'dark' ? styles.darkBubble : styles.lightBubble,
            ].join(' ')}
        >
            {Component}
        </span>
    );

    const RenderHtmlComponent = (Component : React.ReactElement, msg: UIMessage) => (
        <div>
            {msg.parts && msg.parts.filter(part => part.type === 'tool-invocation'  && (part.toolInvocation.toolName === 'getData' || part.toolInvocation.toolName === 'getCount')).map((part) => (
                
                    <span
                        className={[
                            styles.messageBubble,
                            theme === 'dark' ? styles.darkBubble : styles.lightBubble,
                        ].join(' ')}
                        style={{ padding: 0, background: 'none', border: 'none' }}
                        key={part.type === 'tool-invocation' ? part.toolInvocation.toolCallId || nanoid() : nanoid()}
                    >
                        {[part].map((part: any, i: number) => {
                            switch (part.type) {
                                case 'text':
                                    return <span key={i}>{part.text}</span>;
                                case 'tool-invocation': {
                                    const callId = part.toolInvocation.toolCallId;
                                    switch (part.toolInvocation.toolName) {
                                        case 'getDataTool': {
                                            switch (part.toolInvocation.state) {
                                                case 'call':
                                                    return <div key={callId}>Getting data...</div>;
                                                case 'result':
                                                    return (
                                                        <div key={callId}>
                                                            <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble} />
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }
                                        case 'getCountTool': {
                                            switch (part.toolInvocation.state) {
                                                case 'call':
                                                    return <div key={callId}>Getting count...</div>;
                                                case 'result':
                                                    return (
                                                        <div key={callId}>
                                                            <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble}/>
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }
                                        default:
                                            // Fallback: render tool data as JSON
                                            return (
                                                <div key={callId} style={{ margin: '8px 0' }}>
                                                    <JsonView data={part.toolInvocation}  classNames={styles.jsonBubble}/>
                                                </div>
                                            );
                                    }
                                }
                                default:
                                    // Fallback: render part as JSON
                                    return <JsonView key={i} data={part} classNames={styles.jsonBubble}/>;
                            }
                        })}
                    </span>
                
            ))}

            {Component}
        </div>
    )

    if (!theme || !mounted) return <div />;

    return (
        <div
            className={[
                styles.chatContainer,
                theme === 'dark' ? styles.dark : styles.light,
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
                        {renderMessage(msg, idx)}
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>
            <form
                className={styles.inputRow}
                onSubmit={e => {
                    e.preventDefault();
                    if (!input.trim() || isLoading) return;
                    handleSubmit(e);
                }}
            >
                <textarea
                    value={input}
                    onChange={handleInputChange as any}
                    disabled={isLoading}
                    placeholder="Type your message..."
                    className={styles.inputBox + ' ' + (theme === 'dark' ? styles.dark : styles.light)}
                    rows={2}
                    //style={{ resize: 'vertical', minHeight: 40, maxHeight: 120 }}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className={[
                        styles.sendButton,
                        isLoading ? styles.sendButtonDisabled : '',
                        theme === 'dark' ? styles.darkSendButton : styles.lightSendButton,
                    ].join(' ')}
                >
                    {isLoading ? (
                        <span className={styles.spinner} aria-label="Loading" />
                    ) : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default ChatContainer;
