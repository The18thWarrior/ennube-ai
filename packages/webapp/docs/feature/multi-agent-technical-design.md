# Multi-Agent Conversation System - Technical Design

## Overview

This document outlines the technical design for implementing a multi-agent conversation system that extends the existing single-agent chat functionality. The system enables collaborative AI conversations where multiple specialized agents work together to achieve a common goal through iterative rounds of discussion and refinement.

## Current System Analysis

### Existing Chat Route (`/api/chat`)

The current implementation at `webapp/app/api/chat/route.ts` provides:

- **Authentication**: Session-based auth using NextAuth
- **Model Integration**: OpenRouter with DeepSeek/OpenAI models
- **Tool System**: Dynamic tool loading based on agent type
- **Streaming**: Real-time response streaming via `streamText`
- **Agent Types**: `data-steward`, `prospect-finder`, `contract-reader`
- **Tool Examples**: Salesforce, PostgreSQL, data visualization tools

### Key Components Used
- `ai` SDK for text generation and streaming
- Custom tools for SFDC, PostgreSQL integration
- Session management and user identification
- Dynamic prompt generation via `getPrompt()` and `getTools()`

## Multi-Agent System Architecture

### Core Concept

```
User Request → Initiator Agent → Goal Refinement
                     ↓
    Round 1: [Agent A, Agent B, Agent C] → Parallel Processing
                     ↓
    Round 2: [Agent A, Agent B, Agent C] → Fed previous results
                     ↓
    Round N: [Agent A, Agent B, Agent C] → Final iteration
                     ↓
            Summarizer Agent → Final Response
```

### Agent Roles

1. **Initiator Agent**: 
   - Takes user input and converts to structured goal
   - Defines success criteria and approach strategy
   - Not included in the main agent list

2. **Collaborative Agents**: 
   - Work in parallel during rounds
   - Each agent has specialized tools and prompts
   - Maintain context of previous rounds

3. **Summarizer Agent**:
   - Synthesizes all agent outputs
   - Produces final coherent response
   - Not included in the main agent list

### Data Flow Architecture

```typescript
interface MultiAgentRequest {
  agents: string[];           // e.g., ['data-steward', 'prospect-finder']
  rounds: number;            // Number of collaborative rounds
  messages: ChatMessage[];   // User conversation history
}

interface RoundResult {
  roundNumber: number;
  agentResults: AgentResult[];
  timestamp: string;
}

interface AgentResult {
  agent: string;
  response: string;
  toolCalls: ToolCall[];
  steps: number;
  finishReason: string;
}
```

## API Design

### Endpoint: `POST /api/chat/multi`

#### Request Structure
```typescript
{
  "agents": ["data-steward", "prospect-finder", "contract-reader"],
  "rounds": 3,
  "messages": [
    {
      "role": "user",
      "content": "Help me analyze customer data and find prospects"
    }
  ]
}
```

#### Response Structure (Streamed)
```typescript
// Stream format follows existing chat route
{
  "type": "initiator_start",
  "data": { "agent": "initiator", "goal": "refined goal text" }
}

{
  "type": "round_start", 
  "data": { "round": 1, "agents": ["data-steward", "prospect-finder"] }
}

{
  "type": "agent_tool_call",
  "data": { 
    "agent": "data-steward",
    "round": 1,
    "toolCall": { "name": "getSFDCData", "args": {...} }
  }
}

{
  "type": "agent_response",
  "data": {
    "agent": "data-steward", 
    "round": 1,
    "content": "Found 150 customers...",
    "steps": 3
  }
}

{
  "type": "summarizer_response",
  "data": { "content": "Final synthesized response", "complete": true }
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)

#### Files to Create/Modify:

1. **`/app/api/chat/multi/route.ts`** - Main multi-agent endpoint
2. **`/lib/chat/multi-agent/orchestrator.ts`** - Core orchestration logic
3. **`/lib/chat/multi-agent/types.ts`** - TypeScript interfaces
4. **`/lib/chat/multi-agent/agents/initiator.ts`** - Goal refinement agent
5. **`/lib/chat/multi-agent/agents/summarizer.ts`** - Final synthesis agent

#### Core Orchestrator Design:

```typescript
export class MultiAgentOrchestrator {
  constructor(
    private userSub: string,
    private model: any,
    private agents: string[],
    private rounds: number
  ) {}

  async executeConversation(messages: ChatMessage[]): Promise<AsyncIterable<any>> {
    // 1. Initiator phase
    const goal = await this.runInitiator(messages);
    
    // 2. Multi-round collaboration
    let context: RoundContext = { goal, history: [] };
    
    for (let round = 1; round <= this.rounds; round++) {
      const roundResults = await this.executeRound(round, context);
      context.history.push(roundResults);
      yield* this.streamRoundResults(roundResults);
    }
    
    // 3. Summarizer phase
    const summary = await this.runSummarizer(context);
    yield* this.streamSummary(summary);
  }

  private async executeRound(round: number, context: RoundContext): Promise<RoundResult> {
    const agentPromises = this.agents.map(agent => 
      this.runAgentWithContext(agent, round, context)
    );
    
    const agentResults = await Promise.all(agentPromises);
    return { roundNumber: round, agentResults, timestamp: new Date().toISOString() };
  }
}
```

### Phase 2: Agent Integration (Week 2-3)

#### Extend Existing Helper Functions:

1. **Modify `getPrompt()`** to handle special agents:
   ```typescript
   export function getPrompt(agent: string, context?: MultiAgentContext): string {
     switch (agent) {
       case 'initiator':
         return INITIATOR_PROMPT;
       case 'summarizer':
         return SUMMARIZER_PROMPT;
       case 'data-steward':
         return context ? 
           `${DATA_STEWARD_PROMPT}\n\nCurrent Goal: ${context.goal}\n\nPrevious Rounds: ${context.history}` :
           DATA_STEWARD_PROMPT;
       // ... existing cases
     }
   }
   ```

2. **Extend `getTools()`** for context-aware tool selection:
   ```typescript
   export async function getTools(agent: string, userSub: string, context?: MultiAgentContext) {
     const baseTools = await getBaseTools(agent, userSub);
     
     if (context) {
       // Add collaboration tools for sharing data between agents
       baseTools.collaborationTools = createCollaborationTools(context);
     }
     
     return baseTools;
   }
   ```

### Phase 3: Streaming & Client Integration (Week 3-4)

#### Streaming Implementation:

```typescript
export async function POST(req: NextRequest) {
  // ... auth and validation
  
  const orchestrator = new MultiAgentOrchestrator(userSub, model, agents, rounds);
  
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of orchestrator.executeConversation(messages)) {
            controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
```

## Technical Considerations

### Concurrency & Performance

1. **Parallel Agent Execution**: Use `Promise.all()` for round execution
2. **Resource Management**: Limit concurrent API calls to avoid rate limits
3. **Memory Management**: Stream results to prevent memory buildup
4. **Error Handling**: Graceful degradation if individual agents fail

### State Management

```typescript
interface MultiAgentState {
  sessionId: string;
  goal: string;
  currentRound: number;
  totalRounds: number;
  agentStates: Map<string, AgentState>;
  sharedContext: SharedContext;
}

interface SharedContext {
  discoveredData: Record<string, any>;
  intermediateResults: any[];
  collaborationNotes: string[];
}
```

### Tool Sharing & Collaboration

- **Shared Data Store**: Agents can write to and read from shared context
- **Cross-Agent Communication**: Tools for agents to reference each other's work
- **Data Validation**: Ensure data consistency across agents

## Security & Authentication

### Request Validation
```typescript
const multiAgentRequestSchema = z.object({
  agents: z.array(z.enum(['data-steward', 'prospect-finder', 'contract-reader'])),
  rounds: z.number().min(1).max(10), // Prevent excessive resource usage
  messages: z.array(messageSchema)
});
```

### Authorization
- Same session-based auth as existing chat route
- Validate user has access to requested agent types
- Rate limiting for multi-agent requests (more expensive)

## Testing Strategy

### Unit Tests
- `MultiAgentOrchestrator` class methods
- Individual agent prompt generation
- Tool collaboration mechanisms
- Stream formatting and chunking

### Integration Tests
- End-to-end multi-agent conversations
- Error scenarios (agent failures, timeouts)
- Streaming response validation
- Authentication and authorization

### Load Testing
- Multiple concurrent multi-agent sessions
- Resource usage under load
- API rate limit handling

## Error Handling & Resilience

### Agent Failure Scenarios
```typescript
enum AgentFailureStrategy {
  SKIP_AGENT = 'skip',      // Continue without failed agent
  RETRY_AGENT = 'retry',    // Retry with exponential backoff  
  ABORT_SESSION = 'abort'   // Stop entire multi-agent session
}
```

### Timeout Handling
- Individual agent timeout: 30 seconds
- Total session timeout: 5 minutes
- Graceful degradation with partial results

### Monitoring & Observability
- Agent execution metrics
- Round completion times
- Tool call success rates
- User session analytics

## Future Enhancements

### Dynamic Agent Selection
- AI-powered agent selection based on user query
- Agent capability matching
- Load balancing across agent types

### Advanced Collaboration
- Agent-to-agent direct communication
- Hierarchical agent structures (lead agents)
- Specialized collaboration tools

### Performance Optimizations
- Agent result caching
- Predictive agent pre-loading
- Optimized prompt engineering for collaboration

## Deployment & Configuration

### Environment Variables
```bash
MULTI_AGENT_MAX_ROUNDS=10
MULTI_AGENT_TIMEOUT_MS=300000
MULTI_AGENT_RATE_LIMIT=5  # requests per user per minute
```

### Feature Flags
```typescript
interface MultiAgentConfig {
  enabled: boolean;
  maxAgents: number;
  maxRounds: number;
  allowedAgentTypes: string[];
  enabledForUsers: string[];
}
```

This technical design provides a comprehensive foundation for implementing the multi-agent conversation system while maintaining compatibility with the existing chat infrastructure.