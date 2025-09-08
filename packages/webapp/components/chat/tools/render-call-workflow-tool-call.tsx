import { ExecutionDetailsPanel } from "@/components/executions/execution-details-panel";
import { UsageLogEntry } from "@/lib/types";
import { getAgentImage } from "@/lib/utils";
import dayjs from "dayjs";
import { Loader, TriangleAlert } from "lucide-react";
import { useState, useEffect } from "react";

const RenderCallWorkflowToolCallComponent = ({result: {usageId}} : {result: {usageId: string}}) => {
    const [log, setLog] = useState<UsageLogEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!usageId) {
            setError('No Id found');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        fetch(`/api/dashboard/usage/${usageId}`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Error fetching usage data');
                }
                const data = await response.json();
                if (!data || !data.id) {
                    throw new Error('No data found');
                }
                setLog(data as UsageLogEntry);
            })
            .catch((err) => {
                setError(err.message || 'Unknown error');
            })
            .finally(() => setLoading(false));
    }, [usageId]);

    if (loading) {
        return <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2 border rounded">
                {<Loader className="h-4 w-4" />}
                <span>Loading usage data...</span>
            </div>
        </div>;
    }
    if (error) {
        return <div>{error}</div>;
    }
    if (!log) {
        return <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 py-4 my-2 px-2 border rounded">
                {<TriangleAlert className="h-4 w-4 text-red-500" />}
                <span>No data found</span>
            </div>
        </div>;
    }
    const execution = {
        id: log.id,
        agent_name: log.agent,
        image_url: getAgentImage(log.agent),
        status: log.status || "unknown",
        execution_time: dayjs(log.updatedAt).diff(dayjs(log.createdAt), "seconds"),
        created_at: log.createdAt || dayjs(log.timestamp).toISOString(),
        response_data: log.responseData || {
            execution_summary: `Created ${log.recordsCreated} records and updated ${log.recordsUpdated} records`,
            error: null,
            error_code: null,
        },
    };
    return (
        <div className="transition-all duration-300 ease-in-out p-4" style={{ transitionProperty: 'width' }}>
            <ExecutionDetailsPanel execution={execution} onClose={null} coloredBorder={true} collapsible={true} />
        </div>
    );
}
export default RenderCallWorkflowToolCallComponent;