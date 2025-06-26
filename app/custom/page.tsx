'use client';
import React, { useEffect, useState } from "react";
import CustomResponse, { ComponentConfig } from "@/components/custom-response";
import { ToastProvider } from '@/components/ui';
import examplejson from './example.json'
import ChatContainer from "@/components/chat/chat-container";

export default function TestPage() {
  const [config, setConfig] = useState<ComponentConfig[] | null>([
    {
      "type": "Card",
      "children": [
        {
          "type": "CardHeader",
          "children": [
            {
              "type": "Flex",
              "props": {
                "direction": "row",
                "align": "center",
                "justify": "between"
              },
              "children": [
                {
                  "type": "CardTitle",
                  "children": "TechSolutions Inc."
                },
                {
                  "type": "Badge",
                  "props": {
                    "variant": "success"
                  },
                  "children": "Contacted"
                }
              ]
            },
            {
              "type": "Text",
              "props": {
                "variant": "muted"
              },
              "children": "ID: acc-12345"
            }
          ]
        },
        {
          "type": "CardContent",
          "children": [
            {
              "type": "Flex",
              "props": {
                "direction": "col",
                "gap": 4
              },
              "children": [
                {
                  "type": "Flex",
                  "props": {
                    "direction": "col",
                    "gap": 2
                  },
                  "children": [
                    {
                      "type": "Text",
                      "props": {
                        "variant": "label"
                      },
                      "children": "Industry & Size"
                    },
                    {
                      "type": "Text",
                      "children": "Information Technology"
                    },
                    {
                      "type": "Flex",
                      "props": {
                        "direction": "row",
                        "gap": 4
                      },
                      "children": [
                        {
                          "type": "Text",
                          "children": "Revenue: $150.5M"
                        },
                        {
                          "type": "Text",
                          "children": "Employees: 500"
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "Flex",
                  "props": {
                    "direction": "col",
                    "gap": 2
                  },
                  "children": [
                    {
                      "type": "Text",
                      "props": {
                        "variant": "label"
                      },
                      "children": "Address"
                    },
                    {
                      "type": "Text",
                      "children": "123 Innovation Drive"
                    },
                    {
                      "type": "Text",
                      "children": "San Francisco, CA 94105"
                    },
                    {
                      "type": "Text",
                      "children": "USA"
                    }
                  ]
                },
                {
                  "type": "Flex",
                  "props": {
                    "direction": "col",
                    "gap": 2
                  },
                  "children": [
                    {
                      "type": "Text",
                      "props": {
                        "variant": "label"
                      },
                      "children": "Contact"
                    },
                    {
                      "type": "Text",
                      "children": "contact@techsolutions.com"
                    },
                    {
                      "type": "Flex",
                      "props": {
                        "direction": "row",
                        "gap": 4
                      },
                      "children": [
                        {
                          "type": "Text",
                          "children": "Main: +1-415-555-1234"
                        },
                        {
                          "type": "Text",
                          "children": "Support: +1-415-555-5678"
                        }
                      ]
                    },
                    {
                      "type": "Text",
                      "children": "Owner: Sarah Johnson (Account Manager)"
                    },
                    {
                      "type": "Text",
                      "children": "sarah.johnson@techsolutions.com"
                    }
                  ]
                },
                {
                  "type": "Flex",
                  "props": {
                    "direction": "col",
                    "gap": 2
                  },
                  "children": [
                    {
                      "type": "Text",
                      "props": {
                        "variant": "label"
                      },
                      "children": "Notes"
                    },
                    {
                      "type": "Text",
                      "children": "Interested in upgrading to premium services next quarter. Follow up scheduled for June 1st."
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "CardFooter",
          "children": [
            {
              "type": "Flex",
              "props": {
                "direction": "row",
                "justify": "between"
              },
              "children": [
                {
                  "type": "Text",
                  "props": {
                    "variant": "muted"
                  },
                  "children": "Created: 2022-03-15"
                },
                {
                  "type": "Text",
                  "props": {
                    "variant": "muted"
                  },
                  "children": "Industry Code: 7372"
                }
              ]
            }
          ]
        }
      ]
    }
  ]);
  const [error, setError] = useState<string | null>(null);

  if (error) return <div>Error: {error}</div>;
  if (!config) return <div>Loading...</div>;

  return (
    <ToastProvider>
      {/* <CustomResponse config={config} /> */}
      <ChatContainer />
    </ToastProvider>
  );
}