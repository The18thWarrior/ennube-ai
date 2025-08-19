# Multi-Agent API Specification

## Overview

This document provides the complete API specification for the multi-agent conversation system. The API enables collaborative AI conversations where multiple specialized agents work together through iterative rounds to achieve a common goal.

## Base Information

- **Base URL**: `/api/chat/multi`
- **Authentication**: Session-based (NextAuth)
- **Content-Type**: `application/json`
- **Response Format**: Server-Sent Events (SSE) stream

## Endpoints

### POST /api/chat/multi

Initiates a multi-agent conversation with specified agents, rounds, and user messages.

#### Request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <session-token>
```

**Request Body:**
```typescript
{
  "agents": string[],        // Array of agent identifiers
  "rounds": number,          // Number of collaboration rounds (1-10)
  "messages": ChatMessage[]  // Conversation history
}
```

**ChatMessage Interface:**
```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  timestamp?: string;
}
```

**Validation Rules:**
- `agents`: Array of 1-5 valid agent names
- `rounds`: Integer between 1 and 10
- `messages`: Non-empty array with at least one user message

**Valid Agent Names:**
- `data-steward`
- `prospect-finder` 
- `contract-reader`
- (Additional agents as system expands)

#### Example Request

```json
{
  "agents": ["data-steward", "prospect-finder"],
  "rounds": 3,
  "messages": [
    {
      "role": "user",
      "content": "I need to analyze our customer database to find high-value prospects in the healthcare industry who haven't been contacted in the last 6 months."
    }
  ]
}
```

#### Response

The endpoint returns a **Server-Sent Events (SSE)** stream with multiple event types. Each event is formatted as:

```
data: {"type": "event_type", "data": {...}}\n\n
```

#### Stream Event Types

##### 1. Conversation Start
```typescript
{
  "type": "conversation_start",
  "data": {
    "sessionId": string,
    "agents": string[],
    "rounds": number,
    "timestamp": string
  }
}
```

##### 2. Initiator Phase
```typescript
// Initiator starts goal refinement
{
  "type": "initiator_start", 
  "data": {
    "agent": "initiator",
    "timestamp": string
  }
}

// Initiator tool call
{
  "type": "initiator_tool_call",
  "data": {
    "toolCall": {
      "name": string,
      "args": object,
      "id": string
    },
    "timestamp": string
  }
}

// Initiator completes with refined goal
{
  "type": "initiator_complete",
  "data": {
    "goal": string,
    "strategy": string,
    "successCriteria": string[],
    "timestamp": string
  }
}
```

##### 3. Round Events
```typescript
// Round starts
{
  "type": "round_start",
  "data": {
    "round": number,
    "agents": string[],
    "goal": string,
    "timestamp": string
  }
}

// Individual agent starts within round
{
  "type": "agent_start",
  "data": {
    "agent": string,
    "round": number,
    "maxSteps": number,
    "timestamp": string
  }
}

// Agent makes tool call
{
  "type": "agent_tool_call",
  "data": {
    "agent": string,
    "round": number,
    "step": number,
    "toolCall": {
      "name": string,
      "args": object,
      "id": string
    },
    "timestamp": string
  }
}

// Agent tool call result
{
  "type": "agent_tool_result", 
  "data": {
    "agent": string,
    "round": number,
    "step": number,
    "toolCallId": string,
    "result": any,
    "timestamp": string
  }
}

// Agent provides partial response
{
  "type": "agent_response_chunk",
  "data": {
    "agent": string,
    "round": number,
    "chunk": string,
    "timestamp": string
  }
}

// Agent completes
{
  "type": "agent_complete",
  "data": {
    "agent": string,
    "round": number,
    "response": string,
    "toolCalls": ToolCall[],
    "steps": number,
    "finishReason": string,
    "timestamp": string
  }
}

// Round completes
{
  "type": "round_complete",
  "data": {
    "round": number,
    "results": AgentResult[],
    "timestamp": string
  }
}
```

##### 4. Summarizer Phase
```typescript
// Summarizer starts
{
  "type": "summarizer_start",
  "data": {
    "timestamp": string
  }
}

// Summarizer response chunks
{
  "type": "summarizer_chunk",
  "data": {
    "chunk": string,
    "timestamp": string
  }
}

// Final completion
{
  "type": "conversation_complete",
  "data": {
    "summary": string,
    "totalRounds": number,
    "totalAgents": number,
    "executionTime": number,
    "timestamp": string
  }
}
```

##### 5. Error Events
```typescript
{
  "type": "error",
  "data": {
    "error": string,
    "code": string,
    "agent"?: string,
    "round"?: number,
    "recoverable": boolean,
    "timestamp": string
  }
}

{
  "type": "agent_error",
  "data": {
    "agent": string,
    "round": number,
    "error": string,
    "action": "skip" | "retry" | "abort",
    "timestamp": string
  }
}
```

#### Complete Example Response Stream

```
data: {"type": "conversation_start", "data": {"sessionId": "abc123", "agents": ["data-steward", "prospect-finder"], "rounds": 2, "timestamp": "2024-01-15T10:00:00Z"}}\n\n

data: {"type": "initiator_start", "data": {"agent": "initiator", "timestamp": "2024-01-15T10:00:01Z"}}\n\n

data: {"type": "initiator_complete", "data": {"goal": "Identify high-value healthcare prospects using customer database analysis and contact history filtering", "strategy": "Combine data analysis with prospect scoring", "successCriteria": ["Identify at least 10 qualified prospects", "Include contact timeline analysis", "Provide actionable next steps"], "timestamp": "2024-01-15T10:00:05Z"}}\n\n

data: {"type": "round_start", "data": {"round": 1, "agents": ["data-steward", "prospect-finder"], "goal": "Identify high-value healthcare prospects using customer database analysis and contact history filtering", "timestamp": "2024-01-15T10:00:06Z"}}\n\n

data: {"type": "agent_start", "data": {"agent": "data-steward", "round": 1, "maxSteps": 4, "timestamp": "2024-01-15T10:00:07Z"}}\n\n

data: {"type": "agent_tool_call", "data": {"agent": "data-steward", "round": 1, "step": 1, "toolCall": {"name": "getSFDCData", "args": {"query": "SELECT Id, Name, Industry, LastContactDate FROM Account WHERE Industry = 'Healthcare'"}, "id": "tool_1"}, "timestamp": "2024-01-15T10:00:08Z"}}\n\n

data: {"type": "agent_tool_result", "data": {"agent": "data-steward", "round": 1, "step": 1, "toolCallId": "tool_1", "result": {"accounts": [{"Id": "001XX", "Name": "General Hospital", "Industry": "Healthcare", "LastContactDate": "2023-07-15"}]}, "timestamp": "2024-01-15T10:00:10Z"}}\n\n

data: {"type": "agent_response_chunk", "data": {"agent": "data-steward", "round": 1, "chunk": "I found 150 healthcare accounts in our database. ", "timestamp": "2024-01-15T10:00:12Z"}}\n\n

data: {"type": "agent_complete", "data": {"agent": "data-steward", "round": 1, "response": "I found 150 healthcare accounts in our database. 45 haven't been contacted in the last 6 months and show high engagement potential based on previous interactions.", "toolCalls": [{"name": "getSFDCData", "args": {...}}], "steps": 3, "finishReason": "completed", "timestamp": "2024-01-15T10:00:15Z"}}\n\n

data: {"type": "agent_start", "data": {"agent": "prospect-finder", "round": 1, "maxSteps": 4, "timestamp": "2024-01-15T10:00:16Z"}}\n\n

// ... prospect-finder execution ...

data: {"type": "round_complete", "data": {"round": 1, "results": [{"agent": "data-steward", "response": "...", "toolCalls": [...], "steps": 3}, {"agent": "prospect-finder", "response": "...", "toolCalls": [...], "steps": 2}], "timestamp": "2024-01-15T10:00:45Z"}}\n\n

// ... Round 2 execution ...

data: {"type": "summarizer_start", "data": {"timestamp": "2024-01-15T10:02:00Z"}}\n\n

data: {"type": "summarizer_chunk", "data": {"chunk": "Based on the collaborative analysis, I've identified 12 high-value healthcare prospects...", "timestamp": "2024-01-15T10:02:05Z"}}\n\n

data: {"type": "conversation_complete", "data": {"summary": "Based on the collaborative analysis, I've identified 12 high-value healthcare prospects who meet your criteria. The data-steward found 45 accounts not contacted in 6 months, and the prospect-finder scored and ranked them by engagement potential. Here are the top recommendations with next action steps...", "totalRounds": 2, "totalAgents": 2, "executionTime": 125, "timestamp": "2024-01-15T10:02:15Z"}}\n\n
```

## Error Responses

### HTTP Status Codes

- **200**: Successful stream start
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

### Error Response Format

```json
{
  "error": "Invalid request format",
  "code": "VALIDATION_ERROR", 
  "details": {
    "field": "agents",
    "message": "Must contain at least 1 valid agent"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `VALIDATION_ERROR` | Request format invalid | Check request schema |
| `UNAUTHORIZED` | Session expired/invalid | Re-authenticate |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `AGENT_NOT_FOUND` | Invalid agent specified | Use valid agent names |
| `MAX_ROUNDS_EXCEEDED` | Rounds > 10 | Reduce round count |
| `CONVERSATION_TIMEOUT` | Session took too long | Retry with simpler request |
| `AGENT_EXECUTION_FAILED` | Agent encountered error | Check agent status |

## Rate Limiting

- **Multi-agent conversations**: 5 per user per hour
- **Concurrent sessions**: 2 per user
- **Total rounds per day**: 100 per user
- **Rate limit headers** included in response

## Client Integration

### JavaScript/TypeScript Example

```typescript
async function startMultiAgentConversation(request: MultiAgentRequest) {
  const response = await fetch('/api/chat/multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader?.read() || {};
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.substring(6));
        handleMultiAgentEvent(event);
      }
    }
  }
}

function handleMultiAgentEvent(event: MultiAgentEvent) {
  switch (event.type) {
    case 'conversation_start':
      console.log('Conversation started:', event.data);
      break;
    case 'agent_tool_call':
      console.log(`${event.data.agent} calling tool:`, event.data.toolCall);
      break;
    case 'agent_complete':
      console.log(`${event.data.agent} completed:`, event.data.response);
      break;
    case 'conversation_complete':
      console.log('Final summary:', event.data.summary);
      break;
    case 'error':
      console.error('Error:', event.data.error);
      break;
  }
}
```

### React Hook Example

```typescript
function useMultiAgentChat() {
  const [events, setEvents] = useState<MultiAgentEvent[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConversation = useCallback(async (request: MultiAgentRequest) => {
    setIsActive(true);
    setError(null);
    setEvents([]);

    try {
      // Stream handling implementation
      await startMultiAgentConversation(request);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActive(false);
    }
  }, []);

  return { events, isActive, error, startConversation };
}
```

## Monitoring & Analytics

The API includes built-in metrics collection for:

- Conversation completion rates
- Average execution time per agent
- Tool call success rates
- Error frequency and types
- Resource usage per conversation

These metrics are available through the admin dashboard and can be used for system optimization and capacity planning.