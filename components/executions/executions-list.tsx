"use client"

import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { nanoid } from "nanoid"

interface Execution {
  id: string
  agent_name: string
  image_url: string
  status: string
  execution_time: number | null
  created_at: string
}

interface ExecutionsListProps {
  executions: Execution[]
  onSelectExecution: (id: string) => void
  selectedExecutionId: string | null
}

export function ExecutionsList({ executions, onSelectExecution, selectedExecutionId }: ExecutionsListProps) {
  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="mt-2 text-lg font-semibold">No executions found</h3>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Try adjusting your search criteria or run a new agent.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {executions.map((execution) => (
        <Card
          key={nanoid()}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedExecutionId === execution.id ? "ring-2 ring-purple-500 shadow-md" : ""
          }`}
          onClick={() => onSelectExecution(execution.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                <Image
                  src={execution.image_url || "/placeholder.svg"}
                  alt={execution.agent_name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{execution.agent_name}</h3>
                  <StatusBadge status={execution.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}
                </p>
              </div>

              <div className="text-right">
                {execution.execution_time ? (
                  <p className="text-sm font-medium">{(execution.execution_time / 1000).toFixed(2)}s</p>
                ) : (
                  <p className="text-sm font-medium text-amber-500">Running...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          <span>Failed</span>
        </Badge>
      )
    case "in_progress":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3" />
          <span>In Progress</span>
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
