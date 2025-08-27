'use client'

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '../theme-provider';
import styles from './chat-container.module.css';
import { Streamdown } from 'streamdown';
import { cn, getAgentImage, getJsonData, isJson, parseAndValidateResponse } from '@/lib/utils';
import { z } from 'zod';
import { ComponentConfigSchema } from '../custom-response';
import { JsonView } from '@/components/ui/json-view';
import { JsonRecord } from '../generalized-result';
import CustomResponse from '@/components/custom-response';
import { useChat } from '@ai-sdk/react';
import { UIMessage, UIDataTypes, UIMessagePart, UITools, ToolUIPart, isToolUIPart } from 'ai';
import { nanoid } from 'nanoid';
import ChatInput from './chat-input';
import error from 'next/error';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarImage, Button, Card, CardContent } from '../ui';
import { CrmRecordListTable } from './tools/crm-record-list-table';
import { CrmRecordDetailCard } from './tools/crm-record-detail-card';
import { Loader2, User, TriangleAlert, CircleCheck, Loader, Copy } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { RecordIcon } from './tools/icon-map';
import CrmResultCard from './tools/crm-result-card';
import { CustomProfileToolResult } from './wrappers/custom-profile-tool-result';
import { UsageLogEntry } from '@/lib/types';
import dayjs from 'dayjs';
import { ExecutionDetailsPanel } from '@/components/executions/execution-details-panel';
import { Session } from 'next-auth';
import { O } from '@upstash/redis/zmscore-CgRD7oFR';
import { formatDistanceToNow } from 'date-fns';
import { CustomerProfile } from '@/hooks/useCustomerProfile';

// Custom message rendering
export const renderMessage = (msg: UIMessage, idx: number, agent: ReactNode, theme: 'dark' | 'light' | 'system', session: Session | null) => {
    
    // If the message is from the user, always render as text
    if (msg.role === 'user') {
        return RenderHtmlComponent(DefaultMessageComponent(msg, theme), msg, theme, agent, session);
    }
    // Default: render as text
    return RenderHtmlComponent(DefaultMessageComponent(msg, theme), msg, theme, agent, session);
};

const RenderHtmlComponent = (Component : React.ReactElement, msg: UIMessage, theme: 'dark' | 'light' | 'system', agent: ReactNode, session: Session | null) => (
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
                className={cn("mx-2", msg.role === "user" ? "bg-blue-500 text-white" : "bg-card", "")}
            >
                <CardContent className="px-4 py-2 text-base">
                    {msg.parts && msg.parts.filter(part => isToolUIPart(part)  /*&& (part.toolInvocation.toolName === 'getSFDCDataTool' || part.toolInvocation.toolName === 'getPostgresDataTool' || part.toolInvocation.toolName === 'getCount' || part.toolInvocation.toolName === 'callWorkflowTool')*/).map((part) => (
                        <span
                            className={[
                                styles.messageBubble,
                                theme === 'dark' ? styles.darkBubble : styles.lightBubble,
                                
                            ].join(' ')}
                            style={{ padding: 0, background: 'none', border: 'none' }}
                            key={isToolUIPart(part) ? part.toolCallId || nanoid() : nanoid()}
                        >
                            {[part].map((part: UIMessagePart<UIDataTypes, UITools>, i: number) => {
                                // ensure callId is available before any early returns (loader/UI streaming)
                                const callId = (part as any).toolCallId || `call-${i}`;
                                // Narrow to a tool part that contains toolInvocation and toolCallId
                                if (isToolUIPart(part)) {
                                    
                                    if (part.state === 'input-streaming' || part.state === 'input-available') {
                                        return (
                                            <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground my-2 py-4 px-2 border rounded">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Calling {part.type || 'tool'}...</span>
                                            </div>
                                        );
                                    }
                                    if (part.state === 'output-error') {
                                        <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                                            <TriangleAlert className="h-4 w-4 text-red-500" />
                                            <span>{part.errorText}</span>
                                        </div>
                                    }
                                    // Render based on tool name and state
                                        //console.log(_part.toolInvocation)
                                        
                                    
                                    switch (part.type) {
                                        case 'tool-getSFDCDataTool': {                                             
                                            return (
                                                <div key={callId}>
                                                    {RenderGetDataToolCallComponent({}, part.output, theme)}
                                                    {/* <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                </div>
                                            );
                                        }
                                        case 'tool-getCredentials': {
                                            return (
                                                <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                                                    {part.output ? <CircleCheck className="h-4 w-4 text-green-500" /> : <TriangleAlert className="h-4 w-4 text-red-500" />}
                                                    <span>{part.output ? "Credentials Retrieved" : "No Credentials Found"}</span>
                                                </div>
                                            );
                                        }
                                        case 'tool-getPostgresDataTool': {
                                            return (
                                                <div key={callId}>
                                                    {/* {RenderGetDataToolCallComponent(_part.toolInvocation.args, _part.toolInvocation.result, theme)} */}
                                                    <JsonRecord rootLabel="Postgres Data" data={part.output} className={`${styles.jsonBubble} min-w-3/4`} />
                                                </div>
                                            );
                                        }
                                        case 'tool-getPostgresDescribeTool': {
                                            return (
                                                <div key={callId}>
                                                    {/* {RenderGetDataToolCallComponent(_part.toolInvocation.args, _part.toolInvocation.result, theme)} */}
                                                    <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                                                        {(part.output as any)?.success ? <CircleCheck className="h-4 w-4 text-green-500" /> : <TriangleAlert className="h-4 w-4 text-red-500" />}
                                                        <span>{(part.output as any)?.success ? "Schema Retrieved" : "No Schema Found"}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        case 'tool-callWorkflowTool': {
                                            return (
                                                <div key={callId}>
                                                    <RenderCallWorkflowToolCallComponent result={part.output as { usageId : string}} />
                                                    {/* <JsonView data={_part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                </div>
                                            );
                                        }
                                        case 'tool-getCustomerProfilesTool': {
                                            return (
                                                <div key={callId}>
                                                    {RenderGetCustomProfileToolCallComponent({}, part.output as {profiles: CustomerProfile[]}, theme)}
                                                    {/* <JsonView data={_part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                </div>
                                            )
                                        }                                        
                                        case 'tool-getCount': {
                                            return (
                                                <div key={callId}>
                                                    <JsonRecord rootLabel="Get Count" data={part.output} className={`${styles.jsonBubble} min-w-3/4`} />
                                                </div>
                                            );
                                        }
                                        case 'tool-getSFDCFieldDescribeTool': {
                                            return (
                                                <div key={callId}>
                                                    {/* {RenderGetDataToolCallComponent(_part.toolInvocation.args, _part.toolInvocation.result, theme)} */}
                                                    <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                                                        {part.output ? <CircleCheck className="h-4 w-4 text-green-500" /> : <TriangleAlert className="h-4 w-4 text-red-500" />}
                                                        <span>{part.output ? "Fields Retrieved" : "No Fields Found"}</span>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        case 'tool-getSFDCObjectDescribeTool': {
                                            return (
                                                <div key={callId}>
                                                    {/* {RenderGetDataToolCallComponent(_part.toolInvocation.args, _part.toolInvocation.result, theme)} */}
                                                    <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                                                        {part.output ? <CircleCheck className="h-4 w-4 text-green-500" /> : <TriangleAlert className="h-4 w-4 text-red-500" />}
                                                        <span>{part.output ? "Objects Retrieved" : "No Objects Found"}</span>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        default:
                                            // Fallback: render tool data as JSON
                                            
                                            return (
                                                <div key={callId}>
                                                    {/* {RenderGetDataToolCallComponent(_part.toolInvocation.args, _part.toolInvocation.result, theme)} */}
                                                    <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                                                        {part.output ? <CircleCheck className="h-4 w-4 text-green-500" /> : <TriangleAlert className="h-4 w-4 text-red-500" />}
                                                        <span>{part.output ? `${part.type} Complete` : `${part.type} Failed`}</span>
                                                    </div>
                                                </div>
                                            )
                                            
                                    }
                                }
                                
                                switch (part.type) {
                                    case 'text':
                                        return <Streamdown key={i}>{part.text}</Streamdown>;
                                    case 'reasoning': 
                                        return <Streamdown key={i}>{'Reasoning...'}</Streamdown>;
                                    case 'dynamic-tool': 
                                        return <>TODO</>
                                    case 'file': 
                                        return <>TODO</>
                                    case 'source-document': 
                                        return <>TODO</>
                                    case 'source-url': 
                                        return <>TODO</>
                                    case 'step-start': 
                                        return <>TODO</>
                                    default:
                                        // Fallback: render part as Markdown
                                        //return <JsonView key={i} data={part} classNames={styles.jsonBubble}/>;
                                        //return <Streamdown key={i}>{part.text || JSON.stringify(part)}</Streamdown>;
                                        return null;
                                }
                            })}
                        </span>                    
                    ))}

                    {Component}
                </CardContent>
            </Card>
            <TimestampWithCopy msg={msg} />
            
        </div>
        {msg.role === 'user' ?
            <div className="flex size-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 mt-2 ">
              {session?.user?.image ? (
                <img height={35} width={35} className={" border border-gray-300 rounded-full"}
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

const DefaultMessageComponent = (msg: UIMessage, theme: 'dark' | 'light' | 'system') => {
    console.log(msg);
    const _msg = msg.parts ? msg.parts.at(msg.parts.length - 1) as UIMessagePart<UIDataTypes, UITools> : null;
    const value = _msg && _msg.type === 'text' ? _msg.text : '';

    return MessageComponentWrapper( <span >{value}</span>, msg.role, theme);
};

const MessageComponentWrapper = (Component: React.ReactElement, role:string, theme: 'dark' | 'light' | 'system') => (
    <span
        className={[
            styles.messageBubble,
            role === 'user' ? null : styles.botBubble,
            theme === 'dark' ? styles.darkBubble : styles.lightBubble,
        ].join(' ')}
    >
        {Component}
    </span>
);

const RenderGetDataToolCallComponent = (args: any, result: any, theme: 'dark' | 'light' | 'system') => {
    const {records } = result;
    //console.log(result)
    if (!records || records.length === 0) {
        return <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 py-4 px-2 border rounded">
                {<TriangleAlert className="h-4 w-4 text-red-500" />}
                <span>No data found</span>
            </div>
        </div>
    }
    if (records.length === 1) {
        const fields = Object.keys(records[0]).filter((key) => key !== 'Id' && records[0][key] && key !== 'attributes').map((key) => ({
            label: key,
            value: records[0][key],
            icon: RecordIcon.getIcon('default'),
        }));
        // Render single record detail
        return (
            <div>
                <CrmRecordDetailCard icon={RecordIcon.getIcon(records[0].attributes.type)} recordType={records[0].attributes.type} title={records[0].Name} subtitle={`ID: ${records[0].Id}`} fields={fields} />
            </div>
        );
    }
    
    const convertedRecords = records.map((record: { [x: string]: any; Id?: any; attributes?: any; }) => ({
        id: record.Id,
        fields: Object.keys(record).filter((key) => record[key] && key !== 'attributes').map((key) => ({
            label: key,
            value: record[key],
            icon: RecordIcon.getIcon('default'),
        })),
        objectType: record.attributes.type,
    }));
    return (
        <div className="transition-all duration-300 ease-in-out" style={{ transitionProperty: 'width' }}>
            {/* <CrmRecordListView records={records} /> */}
            { <CrmResultCard
                records={convertedRecords}
                totalReturned={convertedRecords.length}
                filterApplied={args?.filter}
                objectType={args?.sobject}
            /> }
        </div>
    );
}

// Timestamp display with copy-to-clipboard button
const TimestampWithCopy = ({ msg } : { msg: UIMessage }) => {
    const { enqueueSnackbar } = useSnackbar();
    const handleCopy = async () => {
        try {
            if (!msg.parts) {
                enqueueSnackbar('Nothing to copy', { variant: 'warning', preventDuplicate: true, autoHideDuration: 3000 });
                return;
            }
            const _msg = msg.parts.at(-1) as UIMessagePart<UIDataTypes, UITools>;
            const value = _msg.type === 'text' ? _msg.text : '';
            await navigator.clipboard.writeText(value);
            enqueueSnackbar('Message copied to clipboard', { variant: 'success', preventDuplicate: true, autoHideDuration: 3000 });
        } catch (err) {
            console.error('Copy failed', err);
            enqueueSnackbar('Failed to copy message', { variant: 'error', preventDuplicate: true, autoHideDuration: 3000 });
        }
    };

    return (
        <div className={'align-middle flex flex-row items-center'}>
            <span className="text-xs text-muted-foreground px-2">
                {/* {msg.createdAt && formatDistanceToNow(msg.createdAt, { addSuffix: true })} */}
                TODO : Fill date
            </span>
            <button
                type="button"
                aria-label="Copy message"
                title="Copy message"
                onClick={handleCopy}
                className=" inline-flex items-center justify-center p-1 text-muted-foreground hover:bg-muted rounded"
            >
                <Copy className="h-4 w-4" />
            </button>
        </div>
    );
}

const RenderGetCustomProfileToolCallComponent = (args: any, result: {profiles: CustomerProfile[]}, theme: 'dark' | 'light' | 'system') => {
    const {profiles } = result;
    if (!profiles || profiles.length === 0) {
        return <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 py-4 px-2 border rounded">
                {<TriangleAlert className="h-4 w-4 text-red-500" />}
                <span>No data found</span>
            </div>
        </div>
    }

    return (
        <div className="transition-all duration-300 ease-in-out" style={{ transitionProperty: 'width' }}>
            {/* <CrmRecordListView records={records} /> */}
            <CustomProfileToolResult
                profiles={profiles}
                filterApplied={args?.filter}
                objectType={args?.sobject}
                onSelectProfile={(profileId) => {
                    // Handle profile selection if needed
                    console.log(`Selected profile ID: ${profileId}`);
                }}
            />
        </div>
    );
}

const RenderCallWorkflowToolCallComponent = ({result: {usageId}} : {result: {usageId: string}}) => {
    const [log, setLog] = useState<UsageLogEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!usageId) {
            setError('No Id found');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        fetch(`/api/dashboard/usage/${usageId}`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Error fetching usage data');
                }
                const data = await response.json();
                if (!data || !data.id) {
                    throw new Error('No data found');
                }
                setLog(data as UsageLogEntry);
            })
            .catch((err) => {
                setError(err.message || 'Unknown error');
            })
            .finally(() => setLoading(false));
    }, [usageId]);

    if (loading) {
        return <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                {<Loader className="h-4 w-4" />}
                <span>Loading usage data...</span>
            </div>
        </div>;
    }
    if (error) {
        return <div>{error}</div>;
    }
    if (!log) {
        return <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 py-4 my-2 px-2 border rounded">
                {<TriangleAlert className="h-4 w-4 text-red-500" />}
                <span>No data found</span>
            </div>
        </div>;
    }
    const execution = {
        id: log.id,
        agent_name: log.agent,
        image_url: getAgentImage(log.agent),
        status: log.status || "unknown",
        execution_time: dayjs(log.updatedAt).diff(dayjs(log.createdAt), "seconds"),
        created_at: log.createdAt || dayjs(log.timestamp).toISOString(),
        response_data: log.responseData || {
            execution_summary: `Created ${log.recordsCreated} records and updated ${log.recordsUpdated} records`,
            error: null,
            error_code: null,
        },
    };
    return (
        <div className="transition-all duration-300 ease-in-out p-4" style={{ transitionProperty: 'width' }}>
            <ExecutionDetailsPanel execution={execution} onClose={null} coloredBorder={true} collapsible={true} />
        </div>
    );
}

const isToolType = (t: string): t is `tool-${string}` => typeof t === 'string' && t.startsWith('tool-');
const isToolPart = (p: UIMessagePart<UIDataTypes, UITools>): p is UIMessagePart<ToolUIPart, UITools> => {
    return !!(p && typeof p === 'object' && 'toolInvocation' in p && 'toolCallId' in p);
};
