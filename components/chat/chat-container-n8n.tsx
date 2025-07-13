'use client'

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '../theme-provider';
import styles from './chat-container.module.css';
import { isJson, parseAndValidateResponse } from '@/lib/utils';
import { z } from 'zod';
import { ComponentConfigSchema } from '../custom-response';
import { JsonView } from '@/components/ui/json-view';
import CustomResponse from '@/components/custom-response';
import { parse } from 'path';

/**
 * Simple chat container using n8n/chat (embed mode)
 */

const N8N_WEBHOOK_URL = 'https://xucre-n8n-05603adf5e11.herokuapp.com/webhook/461da1ee-5c55-4cfd-99fb-842d51359a26/chat';

type CustomResponseType = z.infer<typeof ComponentConfigSchema>;

const ChatContainer = () => {
    const { data: session } = useSession();
    const { theme } = useTheme();
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string; type: 'text' | 'json' | 'custom-ui' }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    React.useEffect(() => { setMounted(true); }, []);

    const sendMessage = async (text: string) => {
        if (!session?.user?.auth0?.sub) return;
        setLoading(true);
        setMessages((msgs) => [...msgs, { role: 'user', content: text, type: 'text' }]);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120_000); // 120 seconds
        try {
            const res = await fetch(N8N_WEBHOOK_URL + '?action=sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                chatInput: text,
                metadata: { subId: session.user.auth0.sub },
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error('Failed to get response');
            const data = await res.json();
            console.log('data:', data);
            if (isJson(data.output)) {
                if (parseAndValidateResponse(data.output, ComponentConfigSchema)) {
                    setMessages((msgs) => [...msgs, { role: 'bot', content: data.output, type: 'custom-ui' }]);
                    //return;
                } else {
                    const jsonData = JSON.parse(data.output);
                    if (parseAndValidateResponse(jsonData.data, ComponentConfigSchema)) {
                        setMessages((msgs) => [...msgs, { role: 'bot', content: data.output, type: 'custom-ui' }]);
                        // return;
                    } else {
                        setMessages((msgs) => [...msgs, { role: 'bot', content: data.output, type: 'json' }]);
                    }                    
                }               
            } else {
                setMessages((msgs) => [...msgs, { role: 'bot', content: data.text || data.message || data.output || JSON.stringify(data), type: 'text' }]);
            }
            
        } catch (err) {
            if ((err as any)?.name === 'AbortError') {
                setMessages((msgs) => [...msgs, { role: 'bot', content: 'Error: Request timed out.', type: 'text' }]);
            } else {
                setMessages((msgs) => [...msgs, { role: 'bot', content: 'Error: Unable to get response.', type: 'text' }]);
            }
        } finally {
            clearTimeout(timeout);
            setLoading(false);
            setInput('');
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleSend = () => {
        if (!input.trim() || loading) return;
        sendMessage(input.trim());
    };
    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    if (!mounted || !theme) return <div />;
    return (
        <div className={[
            styles.chatContainer,
            theme === 'dark' ? styles.dark : styles.light
        ].join(' ')}>
            <div className={styles.messagesArea}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={[
                            styles.messageRow,
                            msg.role === 'user' ? styles.userRow : styles.botRow
                        ].join(' ')}
                    >
                        {msg.type === 'json' ? (
                            <span
                                className={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? styles.userBubble : styles.botBubble,
                                    theme === 'dark' ? styles.darkBubble : styles.lightBubble
                                ].join(' ')}
                                style={{ padding: 0, background: 'none', border: 'none' }}
                            >
                                <JsonView data={isJson(msg.content) ? JSON.parse(msg.content) : msg.content} />
                            </span>
                        ) : msg.type === 'custom-ui' ? (
                            <span
                                className={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? styles.userBubble : styles.botBubble,
                                    theme === 'dark' ? styles.darkBubble : styles.lightBubble
                                ].join(' ')}
                                style={{ padding: 0, background: 'none', border: 'none' }}
                            >
                                <CustomResponse config={isJson(msg.content) ? JSON.parse(msg.content) : msg.content} />
                            </span>
                        ) : (
                            <span
                                className={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? styles.userBubble : styles.botBubble,
                                    theme === 'dark' ? styles.darkBubble : styles.lightBubble
                                ].join(' ')}
                            >
                                {msg.content}
                            </span>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>
            <div className={styles.inputRow}>
                <textarea
                    value={input}
                    onChange={handleOnChange as any}
                    onKeyDown={handleKeyDown as any}
                    disabled={loading}
                    placeholder="Type your message..."
                    className={styles.inputBox + ' ' + (theme === 'dark' ? styles.dark : styles.light)}
                    rows={2}
                    style={{ resize: 'vertical', minHeight: 40, maxHeight: 120 }}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className={[
                        styles.sendButton,
                        loading ? styles.sendButtonDisabled : '',
                        //theme === 'dark' ? styles.darkSendButton : styles.lightSendButton
                    ].join(' ')}
                >
                    {loading ? (
                        <span className={styles.spinner} aria-label="Loading" />
                    ) : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatContainer;
