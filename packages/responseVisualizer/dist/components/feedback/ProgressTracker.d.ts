import React from 'react';
export interface ProgressStep {
    id: string;
    label: string;
    completed: boolean;
}
export interface ProgressTrackerProps {
    /** Progress steps */
    steps: ProgressStep[];
    /** Current step */
    currentStep?: string;
    /** Additional CSS classes */
    className?: string;
}
export declare const ProgressTracker: React.FC<ProgressTrackerProps>;
//# sourceMappingURL=ProgressTracker.d.ts.map