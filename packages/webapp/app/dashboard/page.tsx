"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ExecutionsList } from "@/components/executions/executions-list"
import { ExecutionDetailsPanel } from "@/components/executions/execution-details-panel"
import { Button } from "@/components/ui/button"
import { Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUsageLogs } from "@/hooks/useUsageLogs"
import { nanoid } from "nanoid"
import dayjs from "dayjs";
import { getAgentImage, mapUsageLogToExecution } from "@/lib/utils"

function ExecutionsPageComponent() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null)
  //const [executions, setExecutions] = useState(mockExecutions)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const { logs, refresh, deleteUsageLogs } = useUsageLogs(50);
  const executions = logs.map((log) => {
    return mapUsageLogToExecution(log)
  });
  // Check if there's an execution ID in the URL params
  useEffect(() => {
    const executionId = searchParams.get("id")
    if (executionId) {
      setSelectedExecution(executionId)
      setIsPanelOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    // Fetch logs from the API
    console.log("Fetched logs:", logs);
  }, [logs]);
  useEffect(() => {
    // Fetch logs from the API
    console.log("All executions:", executions);
  }, [executions]);
  // Filter and sort executions based on current state
  const filteredExecutions = executions
    .filter((execution) => {
      // Apply status filter
      if (statusFilter !== "all" && execution.status !== statusFilter) {
        return false
      }

      // Apply search term filter
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase()
        return (
          execution.agent_name.toLowerCase().includes(searchLower) ||
          execution.status.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "agent":
          return a.agent_name.localeCompare(b.agent_name)
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const handleExecutionSelect = (id: string) => {
    setSelectedExecution(id)
    setIsPanelOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUsageLogs(id)
      // Optionally refresh the logs after deletion
      await refresh()
      setSelectedExecution(null)
      setIsPanelOpen(false)
    } catch (error) {
      console.error("Failed to delete usage logs:", error)
    }
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    // Optional: clear the selected execution after animation completes
    setTimeout(() => setSelectedExecution(null), 300)
  }

  const selectedExecutionData = executions.find((exec) => exec.id === selectedExecution)

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Agent Action Details</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search executions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="agent">Agent Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("")
            setStatusFilter("all")
            setSortBy("newest")
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Reset
        </Button>

        <Button
          variant="outline"
          onClick={() => refresh()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 4.5-1.2"/><polyline points="21 12 21 3 12 12"/></svg>
          Refresh
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`flex-1 transition-all duration-300 ${isPanelOpen ? "lg:w-1/2" : "w-full"}`}>
          <ExecutionsList
            executions={filteredExecutions}
            onSelectExecution={handleExecutionSelect}
            selectedExecutionId={selectedExecution}
          />
        </div>

        {isPanelOpen && (
          <div className="lg:w-1/2 transition-all duration-300 ease-in-out">
            <ExecutionDetailsPanel onDelete={handleDelete} execution={selectedExecutionData} onClose={handleClosePanel} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExecutionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <ExecutionsPageComponent />
    </Suspense>
  )
}