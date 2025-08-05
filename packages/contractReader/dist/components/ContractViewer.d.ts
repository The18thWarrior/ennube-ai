import React from 'react';
import { ProcessingResult } from '../types/index.js';
/**
 * OVERVIEW
 *
 * Contract Viewer component displays extracted contract data in a structured,
 * user-friendly format. Shows key contract information including dates,
 * parties, terms, and financial details.
 *
 * Features:
 * - Structured data display with labeled fields
 * - Processing status and timing information
 * - Error display for failed extractions
 * - Responsive design for various screen sizes
 *
 * Assumptions:
 * - Contract data follows the defined ContractData interface
 * - Some fields may be optional or missing
 * - Component is used within a React application
 *
 * Future Improvements:
 * - Edit functionality for contract data
 * - Export options (PDF, CSV)
 * - Data validation indicators
 * - History of processing attempts
 */
export interface ContractViewerProps {
    result: ProcessingResult;
    title?: string;
    showRawText?: boolean;
    onRetry?: () => void;
    className?: string;
}
export declare const ContractViewer: React.FC<ContractViewerProps>;
//# sourceMappingURL=ContractViewer.d.ts.map