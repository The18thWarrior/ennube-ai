import React from 'react';
import { Connection } from 'jsforce';
/**
 * OVERVIEW
 *
 * Contract List component provides a user interface for:
 * - Searching contracts in Salesforce
 * - Displaying contract metadata
 * - Triggering contract document processing
 * - Showing processing results
 *
 * Features:
 * - Contract search with filters
 * - Batch processing capabilities
 * - Real-time processing status
 * - Results display with ContractViewer
 *
 * Assumptions:
 * - Salesforce connection is provided and authenticated
 * - User has proper permissions to access contracts
 * - Processing services are configured correctly
 *
 * Future Improvements:
 * - Pagination for large contract lists
 * - Advanced filtering options
 * - Export functionality for results
 * - Processing queue management
 */
export interface ContractListProps {
    salesforceConnection: Connection;
    className?: string;
    onContractSelect?: (contractId: string) => void;
    defaultFilters?: {
        status?: string;
        dateRange?: {
            start: Date;
            end: Date;
        };
    };
}
export declare const ContractList: React.FC<ContractListProps>;
//# sourceMappingURL=ContractList.d.ts.map