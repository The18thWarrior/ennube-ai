import React from 'react';
export interface AlertBannerProps {
    /** Alert type */
    type: 'info' | 'success' | 'warning' | 'error';
    /** Alert message */
    message: string;
    /** Additional CSS classes */
    className?: string;
}
export declare const AlertBanner: React.FC<AlertBannerProps>;
//# sourceMappingURL=AlertBanner.d.ts.map