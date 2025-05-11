"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ExecutionsList } from "@/components/executions/executions-list"
import { ExecutionDetailsPanel } from "@/components/executions/execution-details-panel"
import { Button } from "@/components/ui/button"
import { Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for executions
const mockExecutions = [
  {
    id: 1,
    agent_name: "Data Steward",
    image_url: "/data-steward.png",
    status: "completed",
    execution_time: 2340,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    response_data: {
      verified_contacts: 125,
      enriched_fields: 430,
      duplicates_removed: 17,
      standardization_applied: true,
      execution_summary: "Successfully processed 125 contacts with 430 enriched fields and removed 17 duplicates.",
    },
  },
  {
    id: 2,
    agent_name: "Prospect Finder",
    image_url: "/prospect-finder.png",
    status: "completed",
    execution_time: 5120,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    response_data: {
      prospects_found: 42,
      matching_criteria: ["industry", "company_size", "technology_stack"],
      data_sources: ["web", "social", "public_records"],
      execution_summary: "Found 42 new prospects matching your ICP criteria across multiple data sources.",
    },
  },
  {
    id: 3,
    agent_name: "Meetings Booker",
    image_url: "/meetings-booker.png",
    status: "completed",
    execution_time: 1850,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    response_data: {
      meetings_scheduled: 8,
      emails_sent: 15,
      calendar_conflicts_resolved: 2,
      execution_summary: "Successfully scheduled 8 meetings with prospects and sent 15 confirmation emails.",
    },
  },
  {
    id: 4,
    agent_name: "Market Nurturer",
    image_url: "/market-nurturer.png",
    status: "completed",
    execution_time: 3200,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    response_data: {
      campaigns_executed: 2,
      emails_sent: 250,
      open_rate: "32%",
      click_rate: "8%",
      execution_summary: "Executed 2 nurture campaigns to 250 contacts with 32% open rate and 8% click rate.",
    },
  },
  {
    id: 5,
    agent_name: "Data Steward",
    image_url: "/data-steward.png",
    status: "failed",
    execution_time: 1200,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
    response_data: {
      error: "API rate limit exceeded",
      error_code: "RATE_LIMIT_EXCEEDED",
      execution_summary: "Failed to complete data enrichment due to API rate limit. Please try again later.",
    },
  },
  {
    id: 6,
    agent_name: "Prospect Finder",
    image_url: "/prospect-finder.png",
    status: "in_progress",
    execution_time: null,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    response_data: {
      status: "in_progress",
      progress: "65%",
      execution_summary: "Currently searching for prospects matching your criteria. 65% complete.",
    },
  },
]

export default function ExecutionsPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedExecution, setSelectedExecution] = useState<number | null>(null)
  const [executions, setExecutions] = useState(mockExecutions)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Check if there's an execution ID in the URL params
  useEffect(() => {
    const executionId = searchParams.get("id")
    if (executionId) {
      setSelectedExecution(Number.parseInt(executionId))
      setIsPanelOpen(true)
    }
  }, [searchParams])

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

  const handleExecutionSelect = (id: number) => {
    setSelectedExecution(id)
    setIsPanelOpen(true)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    // Optional: clear the selected execution after animation completes
    setTimeout(() => setSelectedExecution(null), 300)
  }

  const selectedExecutionData = executions.find((exec) => exec.id === selectedExecution)

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Agent Executions</h1>

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
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
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
            <ExecutionDetailsPanel execution={selectedExecutionData} onClose={handleClosePanel} />
          </div>
        )}
      </div>
    </div>
  )
}
