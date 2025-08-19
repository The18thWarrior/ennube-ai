'use client'

import React from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function ToolCallDisplay({ toolCall, isActive = false } : { toolCall: any; isActive?: boolean }) {
  const status = toolCall?.status || 'call';
  const duration = toolCall?.duration || 0;
  return (
    <div className={`pl-3 border-l-2 ${isActive ? 'border-blue-400' : 'border-gray-200'} p-2`}> 
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm">{toolCall?.name || 'tool'}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {status === 'call' && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === 'result' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
          <span>{status === 'result' ? `${duration}s` : (status === 'call' ? 'Executing' : '')}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        {toolCall?.args && Object.entries(toolCall.args).map(([k,v]) => (
          <div key={k}><span className="text-gray-500">{k}:</span> <span className="font-mono">{typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}</span></div>
        ))}
      </div>
      {toolCall?.result && <div className="mt-2 text-sm bg-slate-50 p-2 rounded"><pre className="text-xs overflow-auto">{JSON.stringify(toolCall.result, null, 2)}</pre></div>}
    </div>
  );
}
