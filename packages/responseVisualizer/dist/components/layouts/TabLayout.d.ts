import React from 'react';
import { LayoutComponentConfig } from '../../types';
export interface TabItem {
    /** Tab identifier */
    id: string;
    /** Tab label */
    label: string;
    /** Tab content */
    content: React.ReactNode;
    /** Tab icon */
    icon?: React.ReactNode;
    /** Disabled state */
    disabled?: boolean;
}
export interface TabLayoutProps {
    /** Tab items */
    tabs: TabItem[];
    /** Default active tab */
    defaultTab?: string;
    /** Tab position */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Tab variant */
    variant?: 'default' | 'pills' | 'underline' | 'card';
    /** Tab size */
    size?: 'sm' | 'md' | 'lg';
    /** Full width tabs */
    fullWidth?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Tab change callback */
    onTabChange?: (tabId: string) => void;
    /** Animation configuration */
    animation?: LayoutComponentConfig['animation'];
    /** Layout configuration */
    layout?: LayoutComponentConfig['layout'];
}
/**
 * Tab panel component
 */
export declare const TabPanel: React.FC<{
    tab: TabItem;
    isActive: boolean;
    animation?: LayoutComponentConfig['animation'];
}>;
/**
 * Main tab layout component
 */
export declare const TabLayout: React.FC<TabLayoutProps>;
/**
 * OVERVIEW
 *
 * Accessible tab layout component with multiple variants and positions.
 * Supports keyboard navigation and ARIA attributes for accessibility.
 * Provides flexible styling options and animation support.
 *
 * Features:
 * - Multiple tab variants (default, pills, underline, card)
 * - Flexible positioning (top, bottom, left, right)
 * - Keyboard accessibility
 * - Full width and responsive options
 * - Animation support
 *
 * Future Improvements:
 * - Lazy loading for tab content
 * - Tab scrolling for overflow
 * - Closeable tabs
 */
//# sourceMappingURL=TabLayout.d.ts.map