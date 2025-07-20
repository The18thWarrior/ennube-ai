import React from 'react';
import { LayoutComponentConfig } from '../../types';
export interface FlexLayoutProps {
    /** Flex direction */
    direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    /** Justify content */
    justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
    /** Align items */
    align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
    /** Flex wrap behavior */
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    /** Gap between items */
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
 * Flexible layout component using CSS Flexbox
 */
export declare const FlexLayout: React.FC<FlexLayoutProps>;
/**
 * Flex item component for child elements
 */
export declare const FlexItem: React.FC<{
    /** Flex grow factor */
    grow?: number;
    /** Flex shrink factor */
    shrink?: number;
    /** Flex basis */
    basis?: 'auto' | 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4';
    /** Align self */
    alignSelf?: 'auto' | 'start' | 'end' | 'center' | 'baseline' | 'stretch';
    /** Additional CSS classes */
    className?: string;
    /** Child content */
    children?: React.ReactNode;
}>;
/**
 * OVERVIEW
 *
 * Comprehensive flexbox layout component with responsive behavior.
 * Supports all flexbox properties and responsive breakpoints.
 * Includes FlexItem component for child element control.
 *
 * Features:
 * - Full flexbox property support
 * - Responsive behavior with mobile-first design
 * - FlexItem component for precise child control
 * - Animation support
 *
 * Future Improvements:
 * - Auto-responsive patterns
 * - Advanced flex utilities
 * - Container query support
 */
//# sourceMappingURL=FlexLayout.d.ts.map