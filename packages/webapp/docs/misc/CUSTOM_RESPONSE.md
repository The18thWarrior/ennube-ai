# CustomResponse Component

The `CustomResponse` component dynamically renders UI elements based on a JSON configuration. This allows LLMs or other services to return JSON describing the desired layout and data, and your app will render it using your existing UI components.

## Configuration Schema

```ts
export interface ComponentConfig {
  // The name of the component or HTML element to render (e.g., "Button", "Flex", "form").
  type: string;
  // Props to pass to the component (e.g., { variant: "default", onClick: handleClick }).
  props?: Record<string, any>;
  // Nested children, either an array of ComponentConfig or a string for text nodes.
  children?: ComponentConfig[] | string;
}
```

## Example API Response

Suppose you have an API endpoint that returns a JSON array of `ComponentConfig`:

```js
// pages/api/custom-response.ts
export default function handler(req, res) {
  res.status(200).json([
    {
      type: "Flex",
      props: { direction: "col", align: "center", justify: "center", className: "space-y-4" },
      children: [
        {
          type: "Text",
          props: { className: "text-xl font-bold" },
          children: "Welcome to the dashboard"
        },
        {
          type: "form",
          props: { onSubmit: "() => alert('submitted')", className: "space-x-2" },
          children: [
            { type: "Input", props: { placeholder: "Enter email", name: "email" } },
            { type: "Button", props: { type: "submit", variant: "default" }, children: "Submit" },
            { type: "Button", props: { variant: "ghost", onClick: "() => console.log('cancel')" }, children: "Cancel" }
          ]
        }
      ]
    }
  ]);
}
```

> Note: In practice, you might serialize function names or references and map them to real callbacks in your code.

## Example LLM Prompt

You can ask an LLM to generate a UI configuration using these available components:

- **Flex**
- **Text**
- **Button**
- **JsonView**
- **Input**
- **Checkbox**
- **Select**
- **RadioGroup**, **RadioGroupItem**
- **Switch**
- **Textarea**
- **Form**
- **Dialog**, **DialogTrigger**, **DialogContent**, **DialogHeader**, **DialogFooter**
- **Tooltip**, **TooltipTrigger**, **TooltipContent**
- **AlertDialog**, **AlertDialogTrigger**, **AlertDialogContent**, **AlertDialogHeader**, **AlertDialogFooter**
- **Avatar**, **AvatarImage**, **AvatarFallback**
- **Badge**
- **Progress**
- **Card**, **CardHeader**, **CardTitle**, **CardDescription**, **CardContent**, **CardFooter**
- **Tabs**, **TabsList**, **TabsTrigger**, **TabsContent**
- **Accordion**, **AccordionItem**, **AccordionTrigger**, **AccordionContent**
- **Table**, **TableHeader**, **TableBody**, **TableRow**, **TableCell**, **TableHead**
- **Popover**, **PopoverTrigger**, **PopoverContent**
- **ScrollArea**, **ScrollBar**
- **Toast**, **ToastProvider**, **ToastViewport**, **ToastTitle**, **ToastDescription**
- **Skeleton**
- **Collapsible**, **CollapsibleTrigger**, **CollapsibleContent**
- **Label**

Below is an example prompt you might send:

```text
You are building a dashboard UI. Using the following components:

- Flex
- Text
- Button
- Input
- Form

Generate a JSON array of ComponentConfig objects that renders:
1. A column flex container centered vertically and horizontally with space-y-4.
2. A header text "User Login".
3. A form with:
   - An email input with placeholder "Email".
   - A password input with placeholder "Password" and type "password".
   - A submit button labeled "Login" with variant "default".
   - A cancel button labeled "Cancel" with variant "ghost".
Return only the JSON.
```

### Expected JSON Response

```json
[
  {
    "type": "Flex",
    "props": {
      "direction": "col",
      "align": "center",
      "justify": "center",
      "className": "space-y-4"
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "className": "text-2xl font-bold"
        },
        "children": "User Login"
      },
      {
        "type": "Form",
        "props": {
          "onSubmit": "handleLogin",
          "className": "space-y-2"
        },
        "children": [
          {
            "type": "Input",
            "props": {
              "placeholder": "Email",
              "name": "email"
            }
          },
          {
            "type": "Input",
            "props": {
              "placeholder": "Password",
              "name": "password",
              "type": "password"
            }
          },
          {
            "type": "Button",
            "props": {
              "type": "submit",
              "variant": "default"
            },
            "children": "Login"
          },
          {
            "type": "Button",
            "props": {
              "variant": "ghost",
              "onClick": "handleCancel"
            },
            "children": "Cancel"
          }
        ]
      }
    ]
  }
]
```

## Rendering the Response

Create a page or component to fetch the config and render it:

```tsx
import React, { useEffect, useState } from 'react'
import CustomResponse, { ComponentConfig } from '@/components/custom-response'

export default function Dashboard() {
  const [config, setConfig] = useState<ComponentConfig[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/custom-response')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then((data: ComponentConfig[]) => setConfig(data))
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div>Error: {error}</div>
  if (!config) return <div>Loading...</div>

  return <CustomResponse config={config} />
}
```

When the API returns the JSON config, the `CustomResponse` component will render your UI dynamically, including forms with submit and cancel buttons.

---

Feel free to adjust the config schema or add support for additional UI components as needed.


```json
[
    {
      type: "Layout",
      props: {
        maxWidth: "md",
        className: "p-6 bg-gray-100  rounded-lg shadow-md",
      },
      children: [
        {
          type: "Flex",
          props: {
            direction: "col",
            align: "center",
            justify: "center",
            className: "space-y-6",
          },
          children: [
            {
              type: "Text",
              props: {
                className: "text-2xl font-bold text-center text-muted-foreground ",
              },
              children: "User Login",
            },
            {
              type: "Form",
              props: {
                className: "space-y-4",
              },
              children: [
                {
                  type: "Input",
                  props: {
                    placeholder: "Email",
                    name: "email",
                    className: "w-full p-2 border rounded  dark:   text-muted-foreground ",
                  },
                },
                {
                  type: "Input",
                  props: {
                    placeholder: "Password",
                    name: "password",
                    type: "password",
                    className: "w-full p-2 border rounded  dark:   text-muted-foreground ",
                  },
                },
                {
                  type: "Flex",
                  props: {
                    direction: "row",
                    align: "center",
                    justify: "space-between",
                    className: "space-x-4",
                  },
                  children: [
                    {
                      type: "Button",
                      props: {
                        type: "submit",
                        variant: "default",
                        className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800",
                      },
                      children: "Login",
                    },
                    {
                      type: "Button",
                      props: {
                        variant: "ghost",
                        className: "px-4 py-2 border rounded  dark: text-muted-foreground  hover:bg-muted ",
                      },
                      children: "Cancel",
                    },
                  ],
                },
              ],
            },
            {
              type: "Accordion",
              props: {
                items: [
                  { title: "Accordion Item 1", content: "Content for item 1" },
                  { title: "Accordion Item 2", content: "Content for item 2" },
                ],
                className: "w-full border rounded  dark:   text-muted-foreground ",
              },
            },
            {
              type: "Tabs",
              props: {
                tabs: [
                  { label: "Tab 1", content: "Content for Tab 1" },
                  { label: "Tab 2", content: "Content for Tab 2" },
                ],
                className: "w-full border rounded  dark:   text-muted-foreground ",
              },
            },
            {
              type: "Card",
              props: {
                title: "Card Title",
                description: "Card Description",
                className: "p-4 border rounded  dark:   text-muted-foreground ",
              },
            },
            {
              type: "Badge",
              props: {
                content: "New",
                className: "px-2 py-1 bg-blue-500 text-white rounded dark:bg-blue-700",
              },
            },
            {
              type: "Progress",
              props: {
                value: 75,
                className: "w-full bg-gray-300 dark:bg-gray-600",
              },
            },
            {
              type: "Popover",
              props: {
                trigger: "Hover me",
                content: "Popover content",
                className: "text-muted-foreground ",
              },
            },
            {
              type: "Toast",
              props: {
                title: "Toast Title",
                description: "Toast Description",
                className: "p-4 bg-gray-100  text-muted-foreground ",
              },
            },
            {
              type: "Skeleton",
              props: {
                width: "100px",
                height: "20px",
                className: "bg-gray-300 dark:bg-gray-600",
              },
            },
            {
              type: "Collapsible",
              props: {
                trigger: "Expand",
                content: "Collapsible content",
                className: "text-muted-foreground ",
              },
            },
            {
              type: "Label",
              props: {
                text: "Label Text",
                className: "text-muted-foreground ",
              },
            },
          ],
        },
      ],
    },
  ]```