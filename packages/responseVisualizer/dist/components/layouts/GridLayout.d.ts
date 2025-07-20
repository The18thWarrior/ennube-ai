import React from 'react';
import { LayoutComponentConfig } from '../../types';
export interface GridLayoutProps {
    /** Number of columns or auto-fit behavior */
    columns?: number | 'auto' | 'fit';
    /** Gap between grid items */
    gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    /** Responsive behavior */
    responsive?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Child components */
    children?: React.ReactNode;
    /** Animation configuration */
    animation?: LayoutComponentConfig['animation'];
    /** Layout configuration */
    layout?: LayoutComponentConfig['layout'];
}
/**
 * Grid layout component for responsive content organization
 */
export declare const GridLayout: React.FC<GridLayoutProps>;
/**
 * OVERVIEW
 *
 * Flexible grid layout component for organizing content in responsive grids.
 * Supports auto-fit columns, custom column counts, and responsive behavior.
 * Includes comprehensive gap and spacing controls.
 *
 * Features:
 * - Responsive grid with breakpoint support
 * - Auto-fit and fixed column layouts
 * - Customizable gaps and spacing
 * - Animation support
 *
 * Future Improvements:
 * - Grid area support for complex layouts
 * - Masonry layout option
 * - Advanced responsive controls
 */
//# sourceMappingURL=GridLayout.d.ts.map