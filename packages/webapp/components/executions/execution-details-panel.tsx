"use client"
import React, { useEffect } from "react"

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
import ExecutionRecordDetailItem from "./execution-record-detail-item"
import { Agent } from "http"
import Link from "next/link"
import { getAgentLink } from "@/lib/utils"
import { Execution } from "@/lib/types"
import { useTheme } from "../theme-provider"
import { useSfdcRecord } from "@/hooks/useSfdcRecord"

interface ExecutionDetailsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  execution: Execution | undefined
  onClose: (() => void) | null
  coloredBorder?: boolean
  collapsible?: boolean
  layout?: 'portrait' | 'landscape'
  onDelete?: (id: string) => void
}

export function ExecutionDetailsPanel({ execution, onClose, coloredBorder, collapsible, layout = 'portrait', className, onDelete }: ExecutionDetailsPanelProps) {
  // Support collapsible state
  const [open, setOpen] = React.useState(collapsible ? false : true);
  const {theme} = useTheme();
  // Flip animation state
  const { instanceUrl } = useSfdcRecord({}, '');
  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null);
  const [flip, setFlip] = React.useState(false);
  const [flipping, setFlipping] = React.useState(false);
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

  useEffect(() => {
    setFlip(false);
    setFlipping(false);
    setSelectedRecordId(null);
  }, [execution]);

  const hasResponseData = execution.response_data && true;
  const executionSummary = !hasResponseData ? "" : (execution.response_data.recordsUpdated || execution.response_data.recordsCreated) ? `Created ${execution.response_data.recordsCreated || 0} records and updated ${execution.response_data.recordsUpdated || 0} records` : execution.response_data.execution_summary;
  const rawData = !hasResponseData ? {} : {...execution.response_data, execution_summary: executionSummary};
  const recordIds = !hasResponseData ? [] : execution.response_data.records || [];

  // const handleSelectRecord = (recordId: string) => {
  //   if (!instanceUrl) {}
  //   // setSelectedRecordId(recordId);
  //   // setFlipping(true);
  //   // setTimeout(() => {
  //   //   setFlip(true);
  //   //   setTimeout(() => {
  //   //     setFlipping(false);
  //   //   }, 500);
  //   // }, 50);
  // };

  const handleGoToList = () => {
    console.log("Going back to list");
    setFlipping(true);
    setTimeout(() => {
      setFlip(false);
      setTimeout(() => {
        setSelectedRecordId(null);
        setFlipping(false);
      }, 500);
    }, 50);
  };
  const AgentHeader = () => {
    return (
      <div className="flex items-center gap-4 flex-auto">
        <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
          <Link href={getAgentLink(execution.agent_name)}>
            <Image
              src={execution.image_url || "/placeholder.svg"}
              alt={execution.agent_name}
              width={64}
              height={64}
              className="object-cover"
            />
          </Link>
          
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
    )
  }
  const FrontCard = () => {
    return (
      <Card className={`${className ? className : "h-full"} ${coloredBorder ? "border-blue-500" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center">
              <Workflow className="mr-2 h-6 w-6 text-blue-500 flex-shrink-0" />
              <span className="truncate">
                Execution Details
              </span>
            </CardTitle>
          <div className="flex items-center gap-2">
            {selectedRecordId && (
              <Button variant={theme === 'dark' ? 'ghost' : 'outline'} size="sm" onClick={handleGoToList}>
                ← Back to List
              </Button>
            )}
            {onClose && 
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            }
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <AgentHeader />

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">EXECUTION ID</h3>
              <p className="font-mono dark:text-gray-400">{execution.id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">EXECUTION TIME</h3>
              <p className="dark:text-gray-400">{execution.execution_time ? `${(execution.execution_time).toFixed(2)} seconds` : execution.status === "success" || execution.status === "failed" ? "Unknown" :"Running..."}</p>
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
            <h3 className="text-lg font-medium mb-2">Records Processed</h3>
            {recordIds.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {recordIds.map((id: string, index: number) => (
                  <li key={id+index} >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      // onClick={() => handleSelectRecord(id)}
                    >
                      <Link href={instanceUrl ? `${instanceUrl}/${id}` : `https://login.salesforce.com/${id}`} rel="noopener noreferrer" target="_blank"><span className="truncate">{id}</span></Link>
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No records processed.</p>
            )}
          </div>        

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

          {onDelete && execution && (
            <div className="flex justify-end pt-4">
              <Button variant="destructive" size="sm" title="Delete Execution" onClick={() => onDelete(execution.id)}>
                <XCircle className="h-4 w-4 mr-2" /> Delete Execution
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const FrontCardCollapsible = () => {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className={`${className ? className : "h-full"} ${coloredBorder ? "border-blue-500" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer select-none">
            <CardTitle className="text-xl flex items-center">
              <Workflow className="mr-2 h-6 w-6 text-blue-500 flex-shrink-0" />
              <span className="truncate">Execution Details</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedRecordId && (
                <Button variant={theme === 'dark' ? 'ghost' : 'outline'} size="sm" onClick={handleGoToList}>
                  ← Back to List
                </Button>
              )}
            </div>
          </CardHeader>
          {/* ...existing collapsible content... */}
          <CardContent className="space-y-6">
            
            {!open && <AgentHeader /> }

            {execution.status === "failed" && !open && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Error Details
                </h3>
                <p className="mt-1 text-red-700">{execution.response_data?.execution_summary || "Unknown error occurred"}</p>
              </div>
            )}

            {execution.status === "in_progress" && !open && (
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

            {execution.status === "success" && !open && execution.response_data?.execution_summary && (
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
                <Button variant={theme === 'dark' ? 'ghost' : 'outline'} className={`${open ? "hidden" : ""}`} size="sm" aria-label={open ? "Collapse" : "Expand"} >
                  {open ? "Show less" : `Show more`}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardContent>
          <CollapsibleContent asChild className={`${styles.CollapsibleContent} `}>
            <CardContent className="pt-0 w-full">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <AgentHeader />
                  
                </div>
                <div className="grid grid-cols-4 gap-4 flex-1">
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

                <h3 className="text-lg font-medium my-2">Response Data</h3>
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
                  <Button variant={theme === 'dark' ? 'ghost' : 'outline'} className={`${open ? "" : "hidden"}`} size="sm" aria-label={open ? "Collapse" : "Expand"}>
                    {open ? "Show less" : `Show more`}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    )
  }

  // If collapsible is enabled, wrap in Collapsible and put Response Data below the fold
  if (typeof collapsible !== "undefined" && collapsible) {
    return (
      <div
        className={`flip-card ${flip ? "flipped" : ""} ${flipping ? "overflow-hidden" : ""}`}
        style={{ perspective: "1000px"}}
      >
        <div
          className={`flip-card-inner w-full h-full relative transition-transform duration-500`}
          style={{ transformStyle: "preserve-3d", transform: flip ? "rotateY(180deg)" : "rotateY(0deg)", position: 'relative' }}
        >
          {/* Front: Original Content */}
          <div
            className={`flip-card-front ${flipping ? "absolute": "relative"} w-full backface-hidden`}
            style={{ backfaceVisibility: "hidden", position: 'relative', height: flip ? "0px" : "" }}
          >
            <FrontCardCollapsible />
          </div>
          
          {/* Back: Record Detail */}
          <div
            className={`flip-card-back w-full backface-hidden ${flipping ? "absolute": "relative"}`}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: 'relative', height: !flip ? "0px" : "" }}
          >
            {selectedRecordId && (
              <ExecutionRecordDetailItem id={selectedRecordId} goBack={handleGoToList} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not collapsible: original rendering
  return (
    <div
      className={`flip-card ${flip ? "flipped" : ""} ${flipping ? "overflow-hidden" : ""}`}
      style={{ perspective: "1000px"}}
    >
      <div
        className={`flip-card-inner w-full h-full relative transition-transform duration-500`}
        style={{ transformStyle: "preserve-3d", transform: flip ? "rotateY(180deg)" : "rotateY(0deg)", position: 'relative' }}
      >
        {/* Front: Original Content */}
        <div
          className={`flip-card-front ${flipping ? "absolute": "relative"} w-full backface-hidden`}
          style={{ backfaceVisibility: "hidden", position: 'relative', height: flip ? "0px" : "" }}
        >
          <FrontCard />
        </div>
        
        {/* Back: Record Detail */}
        <div
          className={`flip-card-back w-full backface-hidden ${flipping ? "absolute": "relative"}`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: 'relative', height: !flip ? "0px" : "" }}
        >
          {selectedRecordId && (
            <ExecutionRecordDetailItem id={selectedRecordId} goBack={handleGoToList}/>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "success":
      return (
        <Badge variant="success" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
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
