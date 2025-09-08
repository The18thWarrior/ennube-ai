import { CustomerProfile } from "@/hooks/useCustomerProfile";
import { TriangleAlert } from "lucide-react";
import { CustomProfileToolResult } from "../wrappers/custom-profile-tool-result";

const RenderGetCustomProfileToolCallComponent = (args: any, result: {profiles: CustomerProfile[]}, theme: 'dark' | 'light' | 'system') => {
    const {profiles } = result;
    if (!profiles || profiles.length === 0) {
        return <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 py-4 px-2 border rounded">
                {<TriangleAlert className="h-4 w-4 text-red-500" />}
                <span>No data found</span>
            </div>
        </div>
    }

    return (
        <div className="transition-all duration-300 ease-in-out" style={{ transitionProperty: 'width' }}>
            {/* <CrmRecordListView records={records} /> */}
            <CustomProfileToolResult
                profiles={profiles}
                filterApplied={args?.filter}
                objectType={args?.sobject}
                onSelectProfile={(profileId) => {
                    // Handle profile selection if needed
                    console.log(`Selected profile ID: ${profileId}`);
                }}
            />
        </div>
    );
}

export default RenderGetCustomProfileToolCallComponent;