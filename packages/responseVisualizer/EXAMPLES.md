# Response Visualizer Package - Usage Examples

## Quick Integration Examples

### 1. Basic LLM Tool Integration

```typescript
// server.ts - Add to your LLM server
import { createVisualizationTool, processVisualizationRequest } from '@ennube/response-visualizer/tools';

const tools = [createVisualizationTool];

// In your LLM completion
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Create a dashboard showing user metrics',
  tools: { create_visualization: createVisualizationTool }
});
```

### 2. React Component Usage

```tsx
// Dashboard.tsx
import { VisualizerRenderer, useVisualization } from '@ennube/response-visualizer';

function Dashboard() {
  const { config, setConfig, isValid } = useVisualization();
  
  // Load config from LLM or API
  useEffect(() => {
    fetch('/api/generate-dashboard')
      .then(res => res.json())
      .then(data => setConfig(data.config));
  }, [setConfig]);

  if (!config || !isValid) return <div>Loading...</div>;
  
  return <VisualizerRenderer config={config} />;
}
```

### 3. MCP Server Integration

```typescript
// mcp-server.ts
import { generateMCPTools, mcpToolHandlers } from '@ennube/response-visualizer/tools';

const server = new MCPServer({
  name: 'visualization-server',
  version: '1.0.0'
});

// Register tools
const tools = generateMCPTools();
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = mcpToolHandlers[name];
  return await handler(args);
});
```

### 4. Custom Component Example

```tsx
// Create a sales dashboard
const dashboardConfig = {
  version: '1.0.0',
  metadata: {
    title: 'Sales Dashboard',
    description: 'Real-time sales metrics'
  },
  theme: {
    primary: 'blue',
    background: 'muted',
    radius: 'lg'
  },
  components: [
    {
      type: 'GridLayout',
      props: { columns: 3, gap: 'lg' },
      children: [
        {
          type: 'MetricCard',
          props: {
            value: '$124,580',
            label: 'Total Revenue',
            className: 'bg-green-50 border-green-200'
          },
          animation: { type: 'fade', delay: 100 }
        },
        {
          type: 'MetricCard',
          props: {
            value: '1,247',
            label: 'New Customers',
            className: 'bg-blue-50 border-blue-200'
          },
          animation: { type: 'fade', delay: 200 }
        },
        {
          type: 'MetricCard',
          props: {
            value: '89.2%',
            label: 'Conversion Rate',
            className: 'bg-purple-50 border-purple-200'
          },
          animation: { type: 'fade', delay: 300 }
        }
      ]
    },
    {
      type: 'TabLayout',
      props: {
        tabs: [
          {
            id: 'overview',
            label: 'Overview',
            content: {
              type: 'DataTable',
              props: {
                data: salesData,
                columns: [
                  { key: 'date', header: 'Date', sortable: true },
                  { key: 'amount', header: 'Amount', sortable: true, type: 'number' },
                  { key: 'customer', header: 'Customer', sortable: true }
                ],
                searchable: true,
                pagination: true
              }
            }
          },
          {
            id: 'analytics',
            label: 'Analytics',
            content: {
              type: 'Chart',
              props: {
                type: 'line',
                data: chartData,
                height: 400
              }
            }
          }
        ]
      }
    }
  ]
};
```

### 5. Express.js Middleware

```typescript
// app.ts
import express from 'express';
import { createVisualizationMiddleware } from '@ennube/response-visualizer/tools';

const app = express();

// Add visualization middleware
app.use(createVisualizationMiddleware({
  llmProcessor: async (prompt, tools) => {
    // Your LLM processing logic
    return await processWithLLM(prompt, tools);
  },
  rateLimiter: (req) => checkRateLimit(req),
  auth: (req) => verifyAuth(req)
}));

// POST /api/visualization will now handle UI generation
```

### 6. Advanced Component Registration

```tsx
// CustomRenderer.tsx
import { VisualizerRenderer } from '@ennube/response-visualizer';
import MyCustomChart from './MyCustomChart';
import MyCustomTable from './MyCustomTable';

const customComponents = {
  MyCustomChart,
  MyCustomTable,
  SpecialMetric: ({ value, trend }) => (
    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-90">Trend: {trend}</div>
    </div>
  )
};

const eventHandlers = {
  handleMetricClick: (metric) => console.log('Metric clicked:', metric),
  handleExport: () => exportData(),
  handleRefresh: () => refreshData()
};

function CustomRenderer({ config }) {
  return (
    <VisualizerRenderer
      config={config}
      components={customComponents}
      handlers={eventHandlers}
    />
  );
}
```

## Key Features Demonstrated

1. **LLM Integration**: Direct tool integration with AI providers
2. **Component Library**: Rich set of pre-built components
3. **Type Safety**: Full TypeScript support throughout
4. **Animations**: Built-in loading states and transitions
5. **Validation**: Automatic sanitization of LLM-generated configs
6. **Extensibility**: Custom component registration
7. **Server-side**: MCP and middleware support
8. **Responsive**: Mobile-first design with Tailwind CSS

## Next Steps

1. Integrate with your existing LLM setup
2. Customize themes and components as needed
3. Add your own component types to the registry
4. Implement server-side processing for your use case
5. Build advanced dashboards with dynamic data sources

## Support

- Check the README.md for comprehensive documentation
- TypeScript definitions provide inline help
- All components are tested and production-ready
- Extensible architecture for custom requirements
