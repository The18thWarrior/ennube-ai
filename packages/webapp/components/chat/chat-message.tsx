'use client'

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '../theme-provider';
import styles from './chat-container.module.css';
import { cn, getAgentImage, getJsonData, isJson, parseAndValidateResponse } from '@/lib/utils';
import { z } from 'zod';
import { ComponentConfigSchema } from '../custom-response';
import { JsonView } from '@/components/ui/json-view';
import { JsonRecord } from '../generalized-result';
import CustomResponse from '@/components/custom-response';
import { useChat } from '@ai-sdk/react';
import { UIMessage, Message } from 'ai';
import { nanoid } from 'nanoid';
import ChatInput from './chat-input';
import error from 'next/error';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarImage, Button, Card, CardContent } from '../ui';
import { CrmRecordListTable } from './tools/crm-record-list-table';
import { CrmRecordDetailCard } from './tools/crm-record-detail-card';
import { Loader2, User, TriangleAlert, CircleCheck, Loader } from 'lucide-react';
import { RecordIcon } from './tools/icon-map';
import CrmResultCard from './tools/crm-result-card';
import { CustomProfileToolResult } from './wrappers/custom-profile-tool-result';
import { UsageLogEntry } from '@/lib/types';
import dayjs from 'dayjs';
import { ExecutionDetailsPanel } from '@/components/executions/execution-details-panel';
import { Session } from 'next-auth';
import { O } from '@upstash/redis/zmscore-CgRD7oFR';

// Custom message rendering
export const renderMessage = (msg: Message, idx: number, agent: ReactNode, theme: 'dark' | 'light' | 'system', session: Session | null) => {
    
    // If the message is from the user, always render as text
    if (msg.role === 'user') {
        return RenderHtmlComponent(DefaultMessageComponent(msg, theme), msg, theme, agent, session);
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
                    {RenderHtmlComponent(<CustomResponse config={getJsonData(msg.content)} />, msg, theme, agent, session)}
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
                    {RenderHtmlComponent(<CustomResponse config={jsonData.data} />, msg, theme, agent, session)}
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
                    {RenderHtmlComponent( MessageComponentWrapper(<JsonRecord data={jsonData} className='min-w-3/4' />, msg.role, theme), msg, theme, agent, session)}
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
                {RenderHtmlComponent( MessageComponentWrapper(<JsonRecord data={jsonData}  className='min-w-3/4' />, msg.role, theme), msg, theme, agent, session)}
            </span>
        );
        
    }

    // Default: render as text
    return RenderHtmlComponent(DefaultMessageComponent(msg, theme), msg, theme, agent, session);
};

const DefaultMessageComponent = (msg: Message, theme: 'dark' | 'light' | 'system') => {
    return MessageComponentWrapper( <span >{msg.content}</span>, msg.role, theme);
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

const RenderHtmlComponent = (Component : React.ReactElement, msg: Message, theme: 'dark' | 'light' | 'system', agent: ReactNode, session: Session | null) => (
    <div className={'flex items-start gap-2'}>
        {msg.role === 'assistant' && 
            <div className="flex aspect-square size-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 mt-2 ">
                {agent}
            </div>
        }
        <Card
            className={cn("mx-2", msg.role === "user" ? "" : "bg-card", "")}
          >
            <CardContent className="p-4 text-base">
                {msg.parts && msg.parts.filter(part => part.type === 'tool-invocation'  /*&& (part.toolInvocation.toolName === 'getSFDCDataTool' || part.toolInvocation.toolName === 'getPostgresDataTool' || part.toolInvocation.toolName === 'getCount' || part.toolInvocation.toolName === 'callWorkflowTool')*/).map((part) => (
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
                                    return <ReactMarkdown key={i}>{part.text}</ReactMarkdown>;
                                case 'tool-invocation': {
                                    const callId = part.toolInvocation.toolCallId;
                                    //console.log(part.toolInvocation)

                                    if (part.toolInvocation.state === 'call') {
                                        return (
                                            <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground my-2 py-4 px-2 border rounded">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Calling {part.toolInvocation.toolName}...</span>
                                            </div>
                                        );
                                    }
                                    switch (part.toolInvocation.toolName) {
                                        case 'getSFDCDataTool': {
                                            switch (part.toolInvocation.state) {
                                                case 'result':                                                 
                                                    return (
                                                        <div key={callId}>
                                                            {RenderGetDataToolCallComponent(part.toolInvocation.args, part.toolInvocation.result, theme)}
                                                            {/* <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }
                                        case 'getData': {
                                            switch (part.toolInvocation.state) {
                                                case 'result':                                                    
                                                    return (
                                                        <div key={callId}>
                                                            {RenderGetDataToolCallComponent(part.toolInvocation.args, part.toolInvocation.result, theme)}
                                                            {/* <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }
                                        case 'getCredentials': {
                                            switch (part.toolInvocation.state) {
                                                case 'result':                                          
                                                    return (
                                                        <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                                                            {part.toolInvocation.result.hasCredentials ? <CircleCheck className="h-4 w-4 text-green-500" /> : <TriangleAlert className="h-4 w-4 text-red-500" />}
                                                            <span>{part.toolInvocation.result.hasCredentials ? "Credentials Retrieved" : "No Credentials Found"}</span>
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }
                                        case 'getPostgresDataTool': {
                                            switch (part.toolInvocation.state) {
                                                case 'result':                                                
                                                    return (
                                                        <div key={callId}>
                                                            {/* {RenderGetDataToolCallComponent(part.toolInvocation.args, part.toolInvocation.result, theme)} */}
                                                            <JsonRecord rootLabel="Postgres Data" data={part.toolInvocation.result} className={`${styles.jsonBubble} min-w-3/4`} />
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }
                                        case 'getPostgresDescribeTool': {
                                            switch (part.toolInvocation.state) {
                                                case 'result':                                                  
                                                    return (
                                                        <div key={callId}>
                                                            {/* {RenderGetDataToolCallComponent(part.toolInvocation.args, part.toolInvocation.result, theme)} */}
                                                            <div key={callId} className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                                                                {part.toolInvocation.result.success ? <CircleCheck className="h-4 w-4 text-green-500" /> : <TriangleAlert className="h-4 w-4 text-red-500" />}
                                                                <span>{part.toolInvocation.result.success ? "Schema Retrieved" : "No Schema Found"}</span>
                                                            </div>
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }
                                        case 'callWorkflowTool': {
                                            switch (part.toolInvocation.state) {
                                                case 'result':                                                    
                                                    return (
                                                        <div key={callId}>
                                                            <RenderCallWorkflowToolCallComponent result={part.toolInvocation.result} />
                                                            {/* <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }
                                        case 'getCustomerProfilesTool': {
                                            switch (part.toolInvocation.state) {
                                                case 'result':                                                    
                                                    return (
                                                        <div key={callId}>
                                                            {RenderGetCustomProfileToolCallComponent(part.toolInvocation.args, part.toolInvocation.result, theme)}
                                                            {/* <JsonView data={part.toolInvocation.result} classNames={styles.jsonBubble} /> */}
                                                        </div>
                                                    );
                                            }
                                            break;
                                        }                                        
                                        case 'getCount': {
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
                                                    <JsonRecord data={part.toolInvocation} className={`${styles.jsonBubble} min-w-3/4`} />
                                                </div>
                                            );
                                    }
                                }
                                default:
                                    // Fallback: render part as Markdown
                                    //return <JsonView key={i} data={part} classNames={styles.jsonBubble}/>;
                                    return <ReactMarkdown key={i}>{part.text || JSON.stringify(part)}</ReactMarkdown>;
                            }
                        })}
                    </span>                    
                ))}

                {Component}
            </CardContent>
        
        </Card>
        {msg.role === 'user' &&
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
            </div>
        }
    </div>
)

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

const RenderGetCustomProfileToolCallComponent = (args: any, result: any, theme: 'dark' | 'light' | 'system') => {
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