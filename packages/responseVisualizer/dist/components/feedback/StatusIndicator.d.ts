import React from 'react';
export interface StatusIndicatorProps {
    /** Status type */
    status: 'success' | 'error' | 'warning' | 'info';
    /** Status text */
    text?: string;
    /** Additional CSS classes */
    className?: string;
}
export declare const StatusIndicator: React.FC<StatusIndicatorProps>;
//# sourceMappingURL=StatusIndicator.d.ts.map