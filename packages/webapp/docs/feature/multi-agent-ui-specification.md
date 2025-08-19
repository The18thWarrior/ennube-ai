# Multi-Agent UI Specification

## Overview

This document provides the complete UI specification for the multi-agent conversation system. The interface builds upon the existing chat components in `components/chat/` to provide a rich, real-time experience for multi-agent collaborative conversations.

## Design Philosophy

- **Leverage existing components**: Maximize reuse of proven chat UI patterns
- **Real-time feedback**: Show agent activity, tool calls, and progress in real-time
- **Visual hierarchy**: Clear distinction between user messages, agent responses, and system events
- **Progressive disclosure**: Show details on demand without overwhelming the user
- **Accessibility**: Full keyboard navigation and screen reader support

## Component Architecture

### Core Components

```typescript
// Multi-agent specific components
MultiAgentChatContainer    // Main container (extends ChatContainer)
AgentPanel                 // Individual agent activity display
RoundProgressIndicator     // Shows current round and progress
ConversationSummary        // Final summary display
MultiAgentInput           // Enhanced input with agent selection

// Enhanced existing components  
EnhancedChatMessage       // Extends chat-message.tsx with multi-agent support
AgentSelector             // Enhanced version from agents.tsx
ToolCallDisplay           // Enhanced tool call visualization
```

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Multi-Agent Chat Header                                             │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ │
│ │ Agent Selection │ │ Round Progress  │ │ Conversation Settings   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                    Message Area                                 │ │
│ │ ┌─────────────────┐ ┌─────────────────┐                       │ │
│ │ │ User Message    │ │ System Event    │                       │ │
│ │ └─────────────────┘ └─────────────────┘                       │ │
│ │                                                               │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │              Round Activity Panel                           │ │ │
│ │ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │ │ │
│ │ │ │ Agent 1      │ │ Agent 2      │ │ Agent 3              │ │ │ │
│ │ │ │ [Activity]   │ │ [Activity]   │ │ [Activity]           │ │ │ │
│ │ │ └──────────────┘ └──────────────┘ └──────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────────┐ │ │
│ │                                                               │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │                   Agent Responses                           │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                     Input Area                                  │ │
│ │ [Agent Selection] [Message Input]                  [Send Button] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Detailed Component Specifications

### 1. MultiAgentChatContainer

**File**: `components/chat/multi-agent-chat-container.tsx`

**Purpose**: Main container that orchestrates the multi-agent conversation experience.

**Props**:
```typescript
interface MultiAgentChatContainerProps {
  id?: string;
  initialMessages?: Message[];
  name?: string;
  selectedAgents?: string[];
  maxRounds?: number;
}
```

**Key Features**:
- Extends existing `ChatContainer` component
- Server-Sent Events (SSE) integration for real-time updates
- State management for multi-agent conversation flow
- Round-based conversation tracking

**Code Structure**:
```typescript
const MultiAgentChatContainer = ({ 
  id, 
  initialMessages, 
  name, 
  selectedAgents = [], 
  maxRounds = 3 
}) => {
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [currentRound, setCurrentRound] = useState(0);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [streamEvents, setStreamEvents] = useState<MultiAgentEvent[]>([]);

  // SSE connection for multi-agent events
  useEffect(() => {
    const eventSource = new EventSource('/api/chat/multi/stream');
    eventSource.onmessage = handleMultiAgentEvent;
    return () => eventSource.close();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <MultiAgentHeader 
        selectedAgents={selectedAgents}
        currentRound={currentRound}
        maxRounds={maxRounds}
        conversationState={conversationState}
      />
      
      <div className="flex-1 overflow-auto">
        <MessageArea events={streamEvents} />
        <RoundActivityPanel 
          agentActivities={agentActivities}
          currentRound={currentRound}
        />
      </div>
      
      <MultiAgentInput
        selectedAgents={selectedAgents}
        onSubmit={startMultiAgentConversation}
        disabled={conversationState !== 'idle'}
      />
    </div>
  );
};
```

### 2. MultiAgentHeader

**Purpose**: Display conversation status, agent selection, and progress

**Visual Design**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🤖 Multi-Agent Conversation                           Round 2 of 3   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                              │
│ │    DS    │ │    PF    │ │    CR    │         [Settings] [Reset]   │
│ │  Active  │ │ Working  │ │ Waiting  │                              │
│ └──────────┘ └──────────┘ └──────────┘                              │
│                                                                     │
│ ████████████████████████████████████████████████░░░░░░░░ 72%        │
└─────────────────────────────────────────────────────────────────────┘
```

**Component Structure**:
```typescript
const MultiAgentHeader = ({ 
  selectedAgents, 
  currentRound, 
  maxRounds, 
  conversationState 
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Multi-Agent Conversation
          </h2>
          <div className="text-sm text-muted-foreground">
            Round {currentRound} of {maxRounds}
          </div>
        </div>
        
        <div className="flex gap-4 items-center mb-4">
          <AgentStatusGrid agents={selectedAgents} />
          <div className="flex-1" />
          <ConversationControls state={conversationState} />
        </div>
        
        <Progress 
          value={(currentRound / maxRounds) * 100} 
          className="h-2"
        />
      </CardContent>
    </Card>
  );
};
```

### 3. AgentStatusGrid

**Purpose**: Show real-time status of each agent

**States**:
- **Idle** (gray): Agent not active
- **Working** (blue, animated): Agent processing
- **Tool Call** (orange, pulsing): Agent executing tools
- **Complete** (green): Agent finished current task
- **Error** (red): Agent encountered error

**Visual Design**:
```typescript
const AgentStatusCard = ({ agent, status, activity }) => {
  const statusConfig = {
    idle: { color: 'gray', icon: Clock, animation: '' },
    working: { color: 'blue', icon: Loader2, animation: 'animate-spin' },
    tool_call: { color: 'orange', icon: Settings, animation: 'animate-pulse' },
    complete: { color: 'green', icon: CheckCircle, animation: '' },
    error: { color: 'red', icon: AlertTriangle, animation: '' }
  };

  const config = statusConfig[status];

  return (
    <Card className={`relative ${getStatusBorderClass(status)}`}>
      <CardContent className="p-3 text-center">
        <Avatar className="mx-auto mb-2">
          <AvatarImage src={`/${agent}.png`} alt={agent} />
          <AvatarFallback>{getAgentInitials(agent)}</AvatarFallback>
        </Avatar>
        
        <div className="text-xs font-medium">{getAgentName(agent)}</div>
        <div className={`flex items-center justify-center gap-1 mt-1 text-xs text-${config.color}-500`}>
          <config.icon className={`h-3 w-3 ${config.animation}`} />
          <span>{getStatusText(status)}</span>
        </div>
        
        {activity && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {activity}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 4. RoundActivityPanel

**Purpose**: Show detailed agent activities within each round

**Visual Design**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📍 Round 2 Activity                               ⏱️ 45s elapsed     │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔵 Data Steward                                    Step 2 of 4   │ │
│ │ └─ 🛠️  getSFDCData("SELECT * FROM Account...")               │ │
│ │    └─ ✅ 147 records found                                    │ │
│ │ └─ 🛠️  filterAccounts({industry: "Healthcare"})              │ │
│ │    └─ ⏳ Processing...                                        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🟠 Prospect Finder                                Waiting...      │ │
│ │ └─ Queued to start after Data Steward completes                │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Component Structure**:
```typescript
const RoundActivityPanel = ({ agentActivities, currentRound }) => {
  const currentRoundActivities = agentActivities.filter(
    activity => activity.round === currentRound
  );

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Round {currentRound} Activity
          </h3>
          <div className="text-sm text-muted-foreground">
            ⏱️ {getRoundDuration(currentRound)} elapsed
          </div>
        </div>
        
        <div className="space-y-4">
          {currentRoundActivities.map(activity => (
            <AgentActivityCard 
              key={activity.agent} 
              activity={activity} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 5. AgentActivityCard

**Purpose**: Detailed view of individual agent activity

```typescript
const AgentActivityCard = ({ activity }) => {
  const { agent, status, steps, currentStep, toolCalls } = activity;

  return (
    <Card className={`${getAgentBorderColor(agent)} relative`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
            <span className="font-medium">{getAgentName(agent)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Step {currentStep} of {steps}
          </div>
        </div>
        
        <div className="space-y-2">
          {toolCalls.map((toolCall, index) => (
            <ToolCallDisplay 
              key={toolCall.id} 
              toolCall={toolCall}
              isActive={index === toolCalls.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 6. Enhanced ToolCallDisplay

**Purpose**: Show tool calls with enhanced multi-agent context

**Visual States**:
```
🛠️  getSFDCData                                          ⏳ Executing...
└─ query: "SELECT Id, Name FROM Account WHERE..."
└─ ✅ 147 records retrieved (2.3s)

🛠️  analyzeProspects                                     ✅ Complete  
└─ prospects: [...147 records]
└─ criteria: {industry: "Healthcare", lastContact: "6mo"}
└─ ✅ 23 high-value prospects identified (1.8s)

🛠️  generateReport                                       ❌ Failed
└─ prospects: [...23 records] 
└─ template: "prospect_summary"
└─ ❌ Template not found (0.5s)
```

```typescript
const EnhancedToolCallDisplay = ({ toolCall, isActive }) => {
  const { name, args, result, status, duration } = toolCall;
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'executing': return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className={`pl-4 border-l-2 ${isActive ? 'border-blue-500' : 'border-gray-200'} transition-all`}>
      <div className="flex items-center gap-2 text-sm">
        <Settings className="h-3 w-3" />
        <span className="font-mono">{name}</span>
        <div className="flex-1" />
        {getStatusIcon(status)}
        <span className="text-xs text-muted-foreground">
          {status === 'executing' ? 'Executing...' : `${duration}s`}
        </span>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground space-y-1">
        {Object.entries(args).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="text-gray-500">└─ {key}:</span>
            <span className="ml-1 font-mono truncate">
              {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
            </span>
          </div>
        ))}
        
        {result && (
          <div className="flex">
            <span className={`${status === 'failed' ? 'text-red-500' : 'text-green-500'}`}>
              └─ {status === 'failed' ? '❌' : '✅'} {result.summary || result.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 7. MultiAgentInput

**Purpose**: Enhanced input with multi-agent conversation controls

**Visual Design**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────┐ ┌─────────────────────────────────────────────┐ │
│ │ Select Agents ▼ │ │ Type your message...                      │ │ 
│ │ ✓ Data Steward  │ │                                           │ │
│ │ ✓ Prospect Find │ │                                           │ │
│ │ ☐ Contract Read │ │                                           │ │
│ └─────────────────┘ └─────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────┐                                   ┌───────────┐ │
│ │ Rounds: 3     ▼ │                                   │   Send    │ │
│ └─────────────────┘                                   └───────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

```typescript
const MultiAgentInput = ({ 
  selectedAgents, 
  onAgentsChange, 
  onSubmit, 
  disabled 
}) => {
  const [input, setInput] = useState('');
  const [rounds, setRounds] = useState(3);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || selectedAgents.length === 0) return;
    
    onSubmit({
      agents: selectedAgents,
      rounds,
      messages: [{ role: 'user', content: input }]
    });
    
    setInput('');
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <MultiSelect
              label="Select Agents"
              value={selectedAgents}
              onChange={onAgentsChange}
              options={avatarOptions}
              min={1}
              max={5}
              disabled={disabled}
            />
            
            <Select
              value={rounds.toString()}
              onValueChange={(value) => setRounds(parseInt(value))}
              disabled={disabled}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Rounds" />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} Round{n > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the task you'd like the agents to collaborate on..."
              className="flex-1"
              disabled={disabled}
              rows={3}
            />
            <Button
              type="submit"
              disabled={disabled || !input.trim() || selectedAgents.length === 0}
              size="icon"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
```

### 8. ConversationSummary

**Purpose**: Display final summary with collapsible details

**Visual Design**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🎯 Conversation Summary                        ✅ Completed (2m 15s) │
├─────────────────────────────────────────────────────────────────────┤
│ Based on the collaborative analysis, I've identified 12 high-value  │
│ healthcare prospects who meet your criteria. The data-steward found │
│ 45 accounts not contacted in 6 months, and the prospect-finder     │
│ scored and ranked them by engagement potential...                   │
│                                                                     │
│ ┌─ 📊 Details ───────────────────────────────────────────────────┐  │
│ │ • Total Rounds: 3                                              │  │
│ │ • Agents Used: 2 (Data Steward, Prospect Finder)              │  │
│ │ • Tool Calls: 8 successful, 1 failed                          │  │
│ │ • Records Processed: 147 → 45 → 12 final prospects           │  │
│ │ • Execution Time: 2m 15s                                      │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 🔗 Next Steps:                                                      │
│ • Review the 12 prospects in the attached report                   │
│ • Schedule follow-up calls within 2 weeks                         │
│ • Update CRM with engagement scores                                │
└─────────────────────────────────────────────────────────────────────┘
```

```typescript
const ConversationSummary = ({ summary, metadata, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Conversation Summary
          </h3>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Completed ({metadata.executionTime}s)
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none mb-4">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
        
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              📊 Details
              <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded border text-sm space-y-2">
              <div>• Total Rounds: {metadata.totalRounds}</div>
              <div>• Agents Used: {metadata.totalAgents} ({metadata.agentNames.join(', ')})</div>
              <div>• Tool Calls: {metadata.toolCallsSuccess} successful, {metadata.toolCallsFailed} failed</div>
              <div>• Execution Time: {metadata.executionTime}s</div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
```

## Real-time Event Handling

### SSE Event Processing

```typescript
const useMultiAgentEvents = () => {
  const [events, setEvents] = useState<MultiAgentEvent[]>([]);
  const [currentState, setCurrentState] = useState<ConversationState>('idle');
  
  useEffect(() => {
    const eventSource = new EventSource('/api/chat/multi/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setEvents(prev => [...prev, data]);
      
      // Update UI state based on event type
      switch (data.type) {
        case 'conversation_start':
          setCurrentState('running');
          break;
          
        case 'round_start':
          setCurrentRound(data.data.round);
          break;
          
        case 'agent_start':
          updateAgentStatus(data.data.agent, 'working');
          break;
          
        case 'agent_tool_call':
          updateAgentActivity(data.data.agent, {
            type: 'tool_call',
            toolName: data.data.toolCall.name,
            status: 'executing'
          });
          break;
          
        case 'agent_complete':
          updateAgentStatus(data.data.agent, 'complete');
          break;
          
        case 'conversation_complete':
          setCurrentState('completed');
          break;
          
        case 'error':
          handleError(data.data);
          break;
      }
    };
    
    return () => eventSource.close();
  }, []);
  
  return { events, currentState };
};
```

## Responsive Design

### Mobile Adaptations

**Breakpoints**:
- **Desktop** (≥1024px): Full layout with side-by-side agent panels
- **Tablet** (≥768px): Stacked agent panels with horizontal scroll
- **Mobile** (<768px): Collapsible agent panels with accordion view

**Mobile Layout**:
```typescript
const MobileMultiAgentView = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Collapsed header on mobile */}
      <div className="p-2 border-b">
        <Button variant="ghost" onClick={() => setShowAgents(true)}>
          👥 {selectedAgents.length} agents • Round {currentRound}
        </Button>
      </div>
      
      {/* Full-screen agent panel when expanded */}
      <Sheet open={showAgents} onOpenChange={setShowAgents}>
        <SheetContent className="w-full">
          <AgentStatusGrid agents={selectedAgents} />
          <RoundActivityPanel activities={agentActivities} />
        </SheetContent>
      </Sheet>
      
      {/* Messages take full height */}
      <div className="flex-1 overflow-auto">
        <MessageArea events={streamEvents} />
      </div>
      
      {/* Simplified input */}
      <div className="p-2 border-t">
        <ChatInput {...inputProps} />
      </div>
    </div>
  );
};
```

## Accessibility Features

### Keyboard Navigation
- Tab through agent selection
- Arrow keys for round navigation  
- Enter to expand/collapse details
- Escape to close modals/sheets

### Screen Reader Support
- Proper ARIA labels for all interactive elements
- Live regions for real-time updates
- Descriptive alt text for agent avatars
- Semantic HTML structure

### Visual Accessibility
- High contrast mode support
- Reduced motion preferences
- Focus indicators on all interactive elements
- Color-blind friendly status indicators

```typescript
const AccessibleAgentStatus = ({ agent, status }) => {
  const statusAnnouncement = `${getAgentName(agent)} is currently ${status}`;
  
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={statusAnnouncement}
      className={getStatusClasses(status)}
    >
      <Avatar aria-hidden="true">
        <AvatarImage src={`/${agent}.png`} alt="" />
        <AvatarFallback>{getAgentInitials(agent)}</AvatarFallback>
      </Avatar>
      
      <span className="sr-only">{statusAnnouncement}</span>
      
      <div className="visible-status" aria-hidden="true">
        {getStatusIcon(status)}
        {getStatusText(status)}
      </div>
    </div>
  );
};
```

## Animation & Transitions

### Smooth State Transitions
```css
/* Agent status transitions */
.agent-card {
  transition: all 0.3s ease-in-out;
  transform-origin: center;
}

.agent-card[data-status="working"] {
  transform: scale(1.02);
  box-shadow: 0 0 0 2px theme(colors.blue.500);
}

/* Tool call animations */
.tool-call-enter {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Round progress */
.round-progress {
  transition: width 1s ease-in-out;
}
```

### Loading States
```typescript
const AgentLoadingState = () => (
  <div className="animate-pulse">
    <div className="h-12 w-12 bg-gray-200 rounded-full mb-2" />
    <div className="h-4 w-16 bg-gray-200 rounded mb-1" />
    <div className="h-3 w-12 bg-gray-200 rounded" />
  </div>
);
```

## Error Handling

### Error Display Components
```typescript
const MultiAgentErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  
  if (hasError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Conversation Error</h3>
          </div>
          <p className="text-sm text-red-600 mb-4">
            {error?.message || 'An unexpected error occurred during the conversation.'}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setHasError(false)}
            >
              Retry
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return children;
};
```

## Integration with Existing Components

### Leveraging ChatContainer
```typescript
const MultiAgentChatContainer = (props) => {
  // Use existing ChatContainer as base
  const chatContainerProps = {
    ...props,
    // Override message rendering for multi-agent
    renderMessage: (msg, idx) => renderMultiAgentMessage(msg, idx),
    // Use enhanced input
    InputComponent: MultiAgentInput,
    // Add multi-agent header
    HeaderComponent: MultiAgentHeader
  };
  
  return (
    <MultiAgentProvider>
      <ChatContainer {...chatContainerProps} />
    </MultiAgentProvider>
  );
};
```

### Enhanced Message Rendering
```typescript
const renderMultiAgentMessage = (msg: Message, idx: number) => {
  // Check if message contains multi-agent metadata
  if (msg.metadata?.type === 'multi-agent-event') {
    return <MultiAgentEventDisplay event={msg.metadata.event} />;
  }
  
  // Use existing renderMessage with multi-agent context
  return renderMessage(msg, idx, getAgentAvatar(msg.agent), theme, session);
};
```

This UI specification provides a complete blueprint for implementing the multi-agent conversation interface while maximizing reuse of existing components and maintaining consistency with the current design system.