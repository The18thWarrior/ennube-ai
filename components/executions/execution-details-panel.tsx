
"use client"
import React from "react"

import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import styles from './execution-details-panel.module.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, CheckCircle, XCircle, Clock, RefreshCw, Workflow, ChevronDown, ChevronUp } from "lucide-react"
import { JsonView } from "../ui/json-view"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../ui/collapsible"



interface Execution {
  id: string
  agent_name: string
  image_url: string
  status: string
  execution_time: number | null
  created_at: string
  response_data: any
}

interface ExecutionDetailsPanelProps {
  execution: Execution | undefined
  onClose: (() => void) | null
  coloredBorder?: boolean
  collapsible?: boolean
}

export function ExecutionDetailsPanel({ execution, onClose, coloredBorder, collapsible }: ExecutionDetailsPanelProps) {
  // Support collapsible state
  const [open, setOpen] = React.useState(collapsible ? false : true);

  if (!execution) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Execution Details</CardTitle>
          {onClose && 
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          }
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No execution selected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasResponseData = execution.response_data && true;
  const executionSummary = !hasResponseData ? "" : (execution.response_data.recordsUpdated || execution.response_data.recordsCreated) ? `Created ${execution.response_data.recordsCreated || 0} records and updated ${execution.response_data.recordsUpdated || 0} records` : execution.response_data.execution_summary;
  const rawData = !hasResponseData ? {} : {...execution.response_data, execution_summary: executionSummary};

  // If collapsible is enabled, wrap in Collapsible and put Response Data below the fold
  if (typeof collapsible !== "undefined" && collapsible) {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className={`h-full ${coloredBorder ? "border-blue-500" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer select-none">
            <CardTitle className="text-xl flex items-center">
              <Workflow className="mr-2 h-6 w-6 text-blue-500 flex-shrink-0" />
              <span className="truncate">Execution Details</span>
            </CardTitle>
            <div className="flex items-center gap-2">
                          
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                <Image
                  src={execution.image_url || "/placeholder.svg"}
                  alt={execution.agent_name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{execution.agent_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={execution.status} />
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">EXECUTION ID</h3>
                <p className="font-mono dark:text-gray-400">{execution.id}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">EXECUTION TIME</h3>
                <p className="dark:text-gray-400">{execution.execution_time ? `${(execution.execution_time).toFixed(2)} seconds` : "Running..."}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">DATE</h3>
                <p className=" dark:text-gray-400">{new Date(execution.created_at).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">STATUS</h3>
                <StatusBadge status={execution.status} />
              </div>
            </div>

            {execution.status === "failed" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Error Details
                </h3>
                <p className="mt-1 text-red-700">{execution.response_data?.execution_summary || "Unknown error occurred"}</p>
                {/* <Button variant="outline" size="sm" className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Execution
                </Button> */}
              </div>
            )}

            {execution.status === "in_progress" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-amber-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Execution in Progress
                </h3>
                <p className="mt-1 text-amber-700">
                  {execution.response_data?.execution_summary ? `Progress: ${execution.response_data.execution_summary}` : "Processing..."}
                </p>
                <div className="w-full bg-amber-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full"
                    style={{ width: execution.response_data?.progress || "50%" }}
                  ></div>
                </div>
              </div>
            )}

            {execution.status === "success" && execution.response_data?.execution_summary && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Execution Summary
                </h3>
                <p className="mt-1 text-green-700">{executionSummary}</p>
              </div>
            )}
            <div className="flex justify-center pt-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className={`${open ? "hidden" : ""}`} size="sm" aria-label={open ? "Collapse" : "Expand"} >
                  {open ? "Show less" : `Show more`}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardContent>
          <CollapsibleContent asChild className={`${styles.CollapsibleContent} `}>
            <CardContent className="pt-0">
              <div>
                <h3 className="text-lg font-medium mb-2">Response Data</h3>
                <Tabs defaultValue="formatted">
                  <TabsList className="mb-4">
                    <TabsTrigger value="formatted">Formatted</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>
                  <TabsContent value="formatted" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <JsonView data={rawData} />
                  </TabsContent>
                  <TabsContent value="raw" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md overflow-auto max-h-96">
                    <pre className="text-xs">{JSON.stringify(rawData, null, 2)}</pre>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="flex justify-center pt-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className={`${open ? "" : "hidden"}`} size="sm" aria-label={open ? "Collapse" : "Expand"}>
                    {open ? "Show less" : `Show more`}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Not collapsible: original rendering
  return (
    <Card className={`h-full ${coloredBorder ? "border-blue-500" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle className="text-xl flex items-center">
            <Workflow className="mr-2 h-6 w-6 text-blue-500 flex-shrink-0" />
            <span className="truncate">
              Execution Details
            </span>
          </CardTitle>
        {onClose && 
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
        }
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
            <Image
              src={execution.image_url || "/placeholder.svg"}
              alt={execution.agent_name}
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold">{execution.agent_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={execution.status} />
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">EXECUTION ID</h3>
            <p className="font-mono dark:text-gray-400">{execution.id}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">EXECUTION TIME</h3>
            <p className="dark:text-gray-400">{execution.execution_time ? `${(execution.execution_time).toFixed(2)} seconds` : "Running..."}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">DATE</h3>
            <p className=" dark:text-gray-400">{new Date(execution.created_at).toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">STATUS</h3>
            <StatusBadge status={execution.status} />
          </div>
        </div>

        {execution.status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Error Details
            </h3>
            <p className="mt-1 text-red-700">{execution.response_data?.execution_summary || "Unknown error occurred"}</p>
            {/* <Button variant="outline" size="sm" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Execution
            </Button> */}
          </div>
        )}

        {execution.status === "in_progress" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Execution in Progress
            </h3>
            <p className="mt-1 text-amber-700">
              {execution.response_data?.execution_summary ? `Progress: ${execution.response_data.execution_summary}` : "Processing..."}
            </p>
            <div className="w-full bg-amber-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-amber-500 h-2.5 rounded-full"
                style={{ width: execution.response_data?.progress || "50%" }}
              ></div>
            </div>
          </div>
        )}

        {execution.status === "success" && execution.response_data?.execution_summary && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Execution Summary
            </h3>
            <p className="mt-1 text-green-700">{executionSummary}</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium mb-2">Response Data</h3>
          <Tabs defaultValue="formatted">
            <TabsList className="mb-4">
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
            <TabsContent value="formatted" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <JsonView data={rawData} />
            </TabsContent>
            <TabsContent value="raw" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(rawData, null, 2)}</pre>
            </TabsContent>
          </Tabs>
        </div>

        {/* <div className="flex justify-end gap-2">
          {execution.status === "success" && <Button variant="outline">Download Results</Button>}
          {execution.status === "failed" && (
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div> */}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "success":
      return (
        <Badge variant="success" className="flex items-center gap-1 text-green-700">
          <CheckCircle className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive" className="flex items-center gap-1 text-red-700">
          <XCircle className="h-3 w-3" />
          <span>Failed</span>
        </Badge>
      )
    case "in_progress":
      return (
        <Badge variant="outline" className="flex items-center gap-1 dark:text-gray-700">
          <Clock className="h-3 w-3" />
          <span>In Progress</span>
        </Badge>
      )
    case "In Progress":
      return (
        <Badge variant="outline" className="flex items-center gap-1 dark:text-gray-500">
          <Clock className="h-3 w-3" />
          <span>In Progress</span>
        </Badge>
      )
    default:
      return <Badge variant="outline" className="dark:text-gray-500">{status}</Badge>
  }
}
