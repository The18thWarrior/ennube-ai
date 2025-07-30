import React from 'react';
export interface TimelineItem {
    id: string;
    title: string;
    description?: string;
    date: string;
}
export interface TimelineProps {
    /** Timeline items */
    items: TimelineItem[];
    /** Additional CSS classes */
    className?: string;
}
export declare const Timeline: React.FC<TimelineProps>;
//# sourceMappingURL=Timeline.d.ts.map