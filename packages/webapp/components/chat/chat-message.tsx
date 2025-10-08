'use client'

import React, { useEffect, useState, ReactNode, useRef } from 'react';
import styles from './chat-container.module.css';
import { Streamdown } from 'streamdown';
import Markdown from 'markdown-to-jsx'
import ReactMarkdown from 'react-markdown'
import { cn, getAgentImage } from '@/lib/utils';
import { JsonRecord } from '../generalized-result';
import { UIMessage, UIDataTypes, UIMessagePart, UITools, isToolUIPart } from 'ai';
import { nanoid } from 'nanoid';
import { Button, Card, CardContent } from '../ui';
import { UpdateDataReviewModal } from './tools/update-data-review-modal';
import { Loader2, User, TriangleAlert, CircleCheck, Loader, Copy } from 'lucide-react';
import { Session } from 'next-auth';
import { CustomerProfile } from '@/hooks/useCustomerProfile';
import DefaultMessageComponent from './default/default-message-component';
import TimestampWithCopy from './default/timestamp-with-copy';
import {Response} from '../ai-elements/response';
import RenderGetDataToolCallComponent from './tools/render-get-data-tool-call';
import RenderCallWorkflowToolCallComponent from './tools/render-call-workflow-tool-call';
import RenderGetCustomProfileToolCallComponent from './tools/render-get-custom-profile-tool-call';
import { ProposalResponse } from '@/types/sfdc-update';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '../ai-elements/reasoning';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '../ai-elements/tool';
import PlanningComponent from './default/planning-component';

// Custom message rendering
export const renderMessage = (msg: UIMessage, idx: number, agent: ReactNode, theme: 'dark' | 'light' | 'lavender', session: Session | null, updateThreadFromTool: (updatedMessage: UIMessage, newMessage?: UIMessage) => void, userSub?: string, agentKey?: string) => {
    // Default: render as text
    return RenderHtmlComponent(DefaultMessageComponent(msg, theme), msg, theme, agent, session, updateThreadFromTool, userSub, agentKey);
};

const RenderHtmlComponent = (Component : React.ReactElement, msg: UIMessage, theme: 'dark' | 'light' | 'lavender', agent: ReactNode, session: Session | null, updateThreadFromTool: (updatedMessage: UIMessage, newMessage?: UIMessage) => void, userSub?: string, agentKey?: string) => (
    <div className={'flex items-start gap-2'}>
        {msg.role === 'assistant' ? 
            <div className="flex aspect-square size-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 mt-2 ">
                {agent}
            </div> :
            <div className="flex aspect-square size-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 mt-2 ">
                
            </div>
        }
        <div>
            <Card
                className={cn("mx-2", msg.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground", "")}
            >
                <CardContent className="px-4 py-2 text-base">
                    {Component}
                    {msg.parts && msg.parts.filter(part => part.type === 'data-planning').map((part) => (
                      <PlanningComponent key={nanoid()} level={(part as any).data?.level || 'info'} message={(part as any).data?.message || ''} />
                    ))}
                    {msg.parts && msg.parts.filter(part => isToolUIPart(part)  /*&& (part.toolInvocation.toolName === 'getSFDCDataTool' || part.toolInvocation.toolName === 'getPostgresDataTool' || part.toolInvocation.toolName === 'getCount' || part.toolInvocation.toolName === 'callWorkflowTool')*/).map((part) => (
                        <span
                            className={[
                                styles.messageBubble
                                
                            ].join(' ')}
                            style={{ padding: 0, background: 'none', border: 'none' }}
                            key={isToolUIPart(part) ? part.toolCallId || nanoid() : nanoid()}
                        >
                            {[part].map((part: UIMessagePart<UIDataTypes, UITools>, i: number) => {
                                // ensure callId is available before any early returns (loader/UI streaming)
                                const callId = (part as any).toolCallId || `call-${i}`;
                                // Narrow to a tool part that contains toolInvocation and toolCallId
                                if (isToolUIPart(part)) {    
                                    switch (part.type) {
                                        case 'tool-proposeUpdateSFDCDataTool': {
                                            const output = part.output as ProposalResponse;
                                            const status = output?.status || 'draft';
                                            const proposal = output?.proposal;
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={<UpdateDataReviewModal open={true} proposal={proposal} closeProposal={updateThreadFromTool} message={msg} status={status} partId={part.toolCallId}/>}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Proposed Changes"
                                                            errorMessage={part.errorText || "Error proposing changes"}
                                                            toolName="Propose Update Tool"
                                                        />
                                                    }
                                                </div>
                                            );
                                        }
                                        case 'tool-generateQueryTool': {                                             
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={<RenderGetDataToolCallComponent args={{}} result={part.output || {records: []}} theme={theme} />}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Data Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving data"}
                                                            toolName="Salesforce Data Tool"
                                                        />
                                                    }
                                                    {/* <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                </div>
                                            );
                                        }  
                                        case 'tool-getSFDCDataTool': {        
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={<RenderGetDataToolCallComponent args={{}} result={part.output} theme={theme} />}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Data Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving data"}
                                                            toolName="Salesforce Data Tool"
                                                        />
                                                    }
                                                    {/* <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                </div>
                                            );
                                        }
                                        case 'tool-getCredentials': {
                                            return (
                                                <div key={callId}>
                                                {
                                                    <MessageStateComponent
                                                        Component={null}
                                                        state={part.state}
                                                            input={part.input}
                                                        theme={theme}
                                                        successMessage="Credentials Retrieved"
                                                        errorMessage={part.errorText || "Error retrieving credentials"}
                                                        toolName="Get Credentials Tool"
                                                    />
                                                }
                                                </div>
                                            );
                                        }
                                        case 'tool-getPostgresDataTool': {
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={<JsonRecord rootLabel="Postgres Data" data={part.output} className={`${styles.jsonBubble} min-w-3/4`} />}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Data Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving data"}
                                                            toolName="Postgres Data Tool"
                                                        />
                                                    }
                                                   
                                                </div>
                                            );
                                        }
                                        case 'tool-getPostgresDescribeTool': {
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={null}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Schema Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving schema"}
                                                            toolName="Postgres Describe Tool"
                                                        />
                                                    }
                                                </div>
                                            );
                                        }
                                        case 'tool-callWorkflowTool': {
                                            return (
                                                <div key={callId}>
                                                    
                                                    {
                                                        <MessageStateComponent
                                                            Component={part.output ? <RenderCallWorkflowToolCallComponent result={part.output as { usageId : string}} /> : null}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Workflow Executed"
                                                            errorMessage={part.errorText || "Error executing workflow"}
                                                            toolName="Call Workflow Tool"
                                                        />
                                                    }
                                                </div>
                                            );
                                        }
                                        case 'tool-getCustomerProfilesTool': {
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={part.output ? RenderGetCustomProfileToolCallComponent({}, part.output as {profiles: CustomerProfile[]}, theme) : null}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Profiles Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving profiles"}
                                                            toolName="Get Customer Profiles Tool"
                                                        />
                                                    }
                                                    {/* <JsonView data={_part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                </div>
                                            )
                                        }                                        
                                        case 'tool-getCount': {
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={<JsonRecord rootLabel="Get Count" data={part.output} className={`${styles.jsonBubble} min-w-3/4`} />}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Count Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving count"}
                                                            toolName="Get Count Tool"
                                                        />
                                                    }
                                                </div>
                                            );
                                        }
                                        case 'tool-getSFDCFieldDescribeTool': {
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={null}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Fields Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving fields"}
                                                            toolName="Describe Fields Tool"
                                                        />
                                                    }
                                                </div>
                                            )
                                        }
                                        case 'tool-getSFDCObjectDescribeTool': {
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={null}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="Objects Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving objects"}
                                                            toolName="Describe Objects Tool"
                                                        />
                                                    }
                                                </div>
                                            )
                                        }

                                        case 'tool-getSFDCFileTool': {
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={part.output ? <JsonRecord rootLabel="File Output" data={part.output} className={`${styles.jsonBubble} min-w-3/4`} /> : null}
                                                            state={part.state}
                                                            input={part.input}
                                                            theme={theme}
                                                            successMessage="File Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving file"}
                                                            toolName="Get File Tool"
                                                        />
                                                    }
                                                </div>
                                            )
                                        }
                                        default:
                                            // Fallback: render tool data as JSON
                                            
                                            return (
                                                <div key={callId}>
                                                    {
                                                        <MessageStateComponent
                                                            Component={part.output ? <JsonRecord rootLabel="Tool Output" data={part.output} className={`${styles.jsonBubble} min-w-3/4`} /> : null}
                                                            state={part.state}
                                                            theme={theme}
                                                            successMessage="Tool Output Retrieved"
                                                            errorMessage={part.errorText || "Error retrieving tool output"}
                                                            toolName={part.type || "Tool"}
                                                        />
                                                    }
                                                </div>
                                            )
                                            
                                    }
                                }
                                
                                switch (part.type) {
                                    case 'text':
                                        return <Response key={`${msg.id}-${i}`}>{part.text}</Response>
                                    case 'reasoning': 
                                        return <Reasoning
                                            key={`${msg.id}-${i}`}
                                            className="w-full"
                                            isStreaming={part.state === 'streaming' && i === msg.parts.length - 1}
                                        >
                                          <ReasoningTrigger />
                                          <ReasoningContent>{part.text}</ReasoningContent>
                                        </Reasoning>
                                    case 'dynamic-tool': 
                                        return null
                                    case 'file': 
                                        return null
                                    case 'source-document': 
                                        return null
                                    case 'source-url': 
                                        return null
                                    case 'step-start': 
                                        return null
                                    default:
                                        // Fallback: render part as Markdown
                                        //return <JsonView key={i} data={part} classNames={styles.jsonBubble}/>;
                                        //return <Streamdown key={i}>{part.text || JSON.stringify(part)}</Streamdown>;
                                        return null;
                                }
                            })}
                        </span>                    
                    ))}
                </CardContent>
            </Card>
            <TimestampWithCopy msg={msg} userSub={userSub} agent={agentKey} />
            
        </div>
        {msg.role === 'user' ?
            <div className="flex size-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 mt-2 ">
              {session?.user?.image ? (
                <img height={35} width={35} className={" border  rounded-full"}
                        src={session?.user?.image ||
                        `/logo.png`
                        }
                        alt={session?.user?.name ?? "User"}
                    />
              ) : <User className="h-5 w-5" />
              }
            </div> :
            <div className="flex aspect-square size-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 mt-2 ">
            </div>
        }
    </div>
)

const MessageStateComponent = ({
  Component,
  state,
  theme,
  successMessage,
  errorMessage,
  toolName,
  input
}: {
  Component: React.ReactElement | null;
  state: "input-streaming" | "input-available" | "output-error" | "output-available";
  theme: "dark" | "light" | "lavender";
  successMessage: string;
  errorMessage: string;
  toolName: string;
  input?: unknown;
}) => {
  //console.log('MessageStateComponent state', state, 'toolName', input);
  return (
    <Tool defaultOpen={false} >
      <ToolHeader type={toolName as `tool-${string}`} state={state} />
      <ToolContent>
        <ToolInput input={input} />
        <ToolOutput
          output={Component}
          errorText={errorMessage}
        />
      </ToolContent>
    </Tool>
  )
};

const MessageStateComponent_old = ({
  Component,
  state,
  theme,
  successMessage,
  errorMessage,
  toolName,
  input
}: {
  Component: React.ReactElement | null;
  state: "input-streaming" | "input-available" | "output-error" | "output-available";
  theme: "dark" | "light" | "system";
  successMessage: string;
  errorMessage: string;
  toolName: string;
  input?: unknown;
}) => {
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(false);

  // Sentinel: true only on the very first paint.
  const firstRender = useRef(true);

  // Flip the sentinel after the first mount.
  useEffect(() => {
    firstRender.current = false;
  }, []);

  // Auto-dismiss error banner (kept from your logic, moved to an effect).
  useEffect(() => {
    if (state === "output-error" && errorMessage.includes("Model tried to call unavailable tool")) {
      const t = setTimeout(() => setHide(true), 5000);
      return () => clearTimeout(t);
    }
  }, [state, errorMessage]);

  // Auto-close success banner after 5s ONLY on non-initial renders
  // when output is available but there's no details Component to show.
  useEffect(() => {
    if (state !== "output-available") return;

    // Reset hide whenever we enter output-available (so it can re-animate in)
    setHide(false);

    // If there's no Component AND this is not the first render,
    // show the banner now and auto-hide after 5s.
    if (!Component && !firstRender.current && !open) {
      const t = setTimeout(() => setHide(true), 5000);
      return () => clearTimeout(t);
    }
  }, [state, Component, open]);

  // Loading states
  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 py-4 px-2 border rounded">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{`Calling ${toolName}...`}</span>
      </div>
    );
  }

  // Error state
  if (state === "output-error") {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground border rounded transition-all duration-3000 ease-in-out transition-discrete ${
          hide ? "h-0 opacity-0" : "block py-4 px-2 my-2"
        }`}
      >
        <TriangleAlert className="h-4 w-4 text-red-500" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  // Success state banner
  if (state === "output-available" && !open) {
    // ✨ Key behavior:
    // If we're on the very first render AND there's no Component, render nothing (hide).
    if (!Component && firstRender.current) {
      return null; // hide on initial load
    }

    // Otherwise show the success banner (even if Component is null).
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground border rounded transition-all duration-3000 ease-in-out transition-discrete ${
          hide ? "h-0 opacity-0" : "block py-4 px-2 my-2"
        }`}
      >
        <CircleCheck className="h-4 w-4 text-green-500" />
        <span>{successMessage}</span>
        {Component && (
          <Button variant="outline" size="sm" className="ml-5" onClick={() => setOpen(true)}>
            View Details
          </Button>
        )}
      </div>
    );
  }

  // Default: render the details when opened, or just the Component if present.
  return Component;
};
