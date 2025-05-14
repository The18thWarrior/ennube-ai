"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface JsonViewProps {
  data: any
  level?: number
  isExpanded?: boolean
}

export function JsonView({ data, level = 0, isExpanded = true }: JsonViewProps) {
  const [expanded, setExpanded] = useState(isExpanded)

  if (data === null) {
    return <span className="text-gray-500 dark:text-gray-400">null</span>
  }

  if (typeof data === "undefined") {
    return <span className="text-gray-500 dark:text-gray-400">undefined</span>
  }

  if (typeof data === "string") {
    return <span className="text-green-600 dark:text-green-300">"{data}"</span>
  }

  if (typeof data === "number") {
    return <span className="text-blue-600 dark:text-blue-300">{data}</span>
  }

  if (typeof data === "boolean") {
    return <span className="text-purple-600 dark:text-purple-300">{data ? "true" : "false"}</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-gray-500 dark:text-gray-400">[]</span>
    }

    return (
      <div>
        <div className="inline-flex items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
          <span className="text-gray-500 dark:text-gray-400">Array({data.length})</span>
        </div>

        {expanded && (
          <div className={cn("pl-4 border-l border-gray-200", level > 0 ? "ml-2" : "")}>
            {data.map((item, index) => (
              <div key={index} className="my-1">
                <span className="text-gray-500 dark:text-gray-400 mr-2">{index}:</span>
                <JsonView data={item} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeof data === "object") {
    const keys = Object.keys(data)

    if (keys.length === 0) {
      return <span className="text-gray-500 dark:text-gray-400">{"{}"}</span>
    }

    return (
      <div>
        <div className="inline-flex items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
          <span className="text-gray-500 dark:text-gray-400">Object({keys.length})</span>
        </div>

        {expanded && (
          <div className={cn("pl-4 border-l border-gray-200", level > 0 ? "ml-2" : "")}>
            {keys.map((key) => (
              <div key={key} className="my-1">
                <span className="text-gray-800 dark:text-gray-200 font-medium mr-2">{key}:</span>
                <JsonView data={data[key]} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <span>{String(data)}</span>
}
