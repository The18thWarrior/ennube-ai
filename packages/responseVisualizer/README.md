# Response Visualizer

A TypeScript package for LLMs to generate custom UI visualizations with React components. Built with Tailwind CSS and designed for seamless integration with AI SDK and Model Context Protocol (MCP) servers.

## Features

- 🤖 **LLM-Friendly**: Designed specifically for Large Language Models to generate UIs
- 🎨 **Comprehensive Components**: Layout, data visualization, forms, and feedback components
- ⚡ **Tailwind CSS**: Pre-styled components with consistent design system
- 🔄 **Loading States**: Built-in loading indicators and animations
- 🛡️ **Security First**: Validation and sanitization of LLM-generated configurations
- 📱 **Responsive**: Mobile-first responsive design
- ♿ **Accessible**: ARIA-compliant components for accessibility
- 🔧 **Type Safe**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @ennube/response-visualizer
# or
yarn add @ennube/response-visualizer
# or
pnpm add @ennube/response-visualizer
```

## Quick Start

### Basic Usage

```tsx
import { VisualizerRenderer, VisualizationConfig } from '@ennube/response-visualizer';

const config: VisualizationConfig = {
  version: '1.0.0',
  metadata: {
    title: 'My Dashboard',
    description: 'A sample dashboard'
  },
  components: [
    {
      type: 'GridLayout',
      props: { columns: 2, gap: 'md' },
      children: [
        {
          type: 'MetricCard',
          props: { value: '1,234', label: 'Active Users' }
        },
        {
          type: 'Chart',
          props: { 
            type: 'line', 
            data: [
              { month: 'Jan', value: 100 },
              { month: 'Feb', value: 120 }
            ]
          }
        }
      ]
    }
  ]
};

function App() {
  return <VisualizerRenderer config={config} />;
}
```

### With React Hook

```tsx
import { useVisualization } from '@ennube/response-visualizer';

function VisualizationEditor() {
  const {
    config,
    setConfig,
    addComponent,
    isValid,
    errors
  } = useVisualization();

  return (
    <div>
      {config && <VisualizerRenderer config={config} />}
      {!isValid && (
        <div>Errors: {errors.join(', ')}</div>
      )}
    </div>
  );
}
```

## Available Components

### Layout Components
- **GridLayout**: Responsive grid container
- **FlexLayout**: Flexible layout with full flexbox support
- **TabLayout**: Accessible tabbed interface

### Data Components
- **DataTable**: Feature-rich table with sorting, filtering, pagination
- **Chart**: Chart visualization (line, bar, pie, area, scatter)
- **MetricCard**: Key metric display cards
- **Timeline**: Chronological data display

### Form Components
- **FormBuilder**: Dynamic form generation
- **DynamicInput**: Multi-type input component

### Feedback Components
- **StatusIndicator**: Status display with icons
- **AlertBanner**: Dismissible alert notifications
- **ProgressTracker**: Multi-step progress indication

## LLM Integration

### Using with AI SDK

```typescript
import { createVisualizationTool } from '@ennube/response-visualizer/tools';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Create a dashboard for user analytics',
  tools: {
    create_visualization: createVisualizationTool
  }
});
```

### MCP Server Integration

```typescript
import { generateMCPTools, mcpToolHandlers } from '@ennube/response-visualizer/tools';

// In your MCP server
const tools = generateMCPTools();

// Handle tool calls
async function handleToolCall(name: string, args: any) {
  const handler = mcpToolHandlers[name];
  return await handler(args);
}
```

### Server-side Processing

```typescript
import { processVisualizationRequest } from '@ennube/response-visualizer/tools';

const response = await processVisualizationRequest({
  prompt: 'Create a sales dashboard',
  data: { sales: salesData },
  preferences: { theme: 'modern' }
});

if (response.success) {
  // Use response.config with VisualizerRenderer
}
```

## Component Examples

### Data Table

```tsx
const tableConfig = {
  type: 'DataTable',
  props: {
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' }
    ],
    columns: [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'email', header: 'Email', sortable: true },
      { key: 'status', header: 'Status', type: 'string' }
    ],
    searchable: true,
    pagination: true
  }
};
```

### Grid Layout with Metrics

```tsx
const dashboardConfig = {
  type: 'GridLayout',
  props: { columns: 'auto', gap: 'lg', responsive: true },
  children: [
    {
      type: 'MetricCard',
      props: { 
        value: '12,345', 
        label: 'Total Revenue',
        className: 'bg-blue-50 border-blue-200'
      }
    },
    {
      type: 'MetricCard',
      props: { 
        value: '89.2%', 
        label: 'Success Rate',
        className: 'bg-green-50 border-green-200'
      }
    }
  ]
};
```

### Form Builder

```tsx
const formConfig = {
  type: 'FormBuilder',
  props: {
    fields: [
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        required: true
      },
      {
        name: 'role',
        type: 'select',
        label: 'Role',
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'User', value: 'user' }
        ]
      }
    ],
    submitText: 'Create User'
  }
};
```

## Styling and Theming

Components use Tailwind CSS classes and can be customized with themes:

```tsx
const themedConfig = {
  theme: {
    primary: 'blue',
    background: 'muted',
    radius: 'lg',
    shadow: 'md'
  },
  components: [
    // Your components here
  ]
};
```

## Animation Support

Add animations to components:

```tsx
const animatedConfig = {
  type: 'FlexLayout',
  animation: {
    type: 'fade',
    duration: 300,
    delay: 100
  },
  children: [
    // Animated children
  ]
};
```

## Loading States

Components support loading states:

```tsx
const loadingConfig = {
  type: 'DataTable',
  loading: {
    enabled: true,
    type: 'skeleton',
    text: 'Loading data...'
  },
  props: {
    // Table props
  }
};
```

## Validation and Security

All configurations are validated and sanitized:

```typescript
import { validateVisualizationConfig } from '@ennube/response-visualizer';

const validation = validateVisualizationConfig(config);
if (validation.isValid) {
  // Safe to render
  const sanitizedConfig = validation.sanitized;
}
```

## Advanced Usage

### Custom Components

Register custom components:

```tsx
import { VisualizerRenderer } from '@ennube/response-visualizer';

const customComponents = {
  MyCustomComponent: MyComponent
};

<VisualizerRenderer 
  config={config} 
  components={customComponents}
/>
```

### Event Handlers

Bind event handlers:

```tsx
const handlers = {
  handleClick: () => console.log('Clicked!'),
  handleSubmit: (data) => console.log('Submitted:', data)
};

<VisualizerRenderer 
  config={config} 
  handlers={handlers}
/>
```

### Data Providers

Dynamic data loading:

```tsx
const dataProviders = {
  fetchUsers: async () => {
    const response = await fetch('/api/users');
    return response.json();
  }
};

<VisualizerRenderer 
  config={config} 
  dataProviders={dataProviders}
/>
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  VisualizationConfig, 
  ComponentConfig, 
  GridLayoutProps,
  DataTableProps 
} from '@ennube/response-visualizer';
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://docs.ennube.ai/response-visualizer)
- 🐛 [Issues](https://github.com/your-org/ennube-ai/issues)
- 💬 [Discussions](https://github.com/your-org/ennube-ai/discussions)

---

Built with ❤️ by the Ennube AI team
