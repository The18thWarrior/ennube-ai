import React from 'react';
export interface ChartProps {
    /** Chart data */
    data: any[];
    /** Chart type */
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    /** Chart width */
    width?: number | string;
    /** Chart height */
    height?: number | string;
    /** Loading state */
    loading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
export declare const Chart: React.FC<ChartProps>;
//# sourceMappingURL=Chart.d.ts.map