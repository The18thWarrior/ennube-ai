// === components/layouts/GridLayout.tsx ===
// Created: 2025-07-19 15:10
// Purpose: Grid layout component for organizing content in responsive grids
// Exports:
//   - GridLayout: Main grid container component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Responsive grid with customizable columns and gaps
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { clsx } from 'clsx';
import { getAnimationClasses } from '../../utils/animation-utils';
/**
 * Grid layout component for responsive content organization
 */
export const GridLayout = ({ columns = 'auto', gap = 'md', responsive = true, className, children, animation, layout }) => {
    // Generate grid classes
    const gridClasses = React.useMemo(() => {
        const classes = ['grid'];
        // Column classes
        if (typeof columns === 'number') {
            if (columns <= 12) {
                classes.push(`grid-cols-${columns}`);
            }
            else {
                classes.push('grid-cols-12');
            }
        }
        else if (columns === 'auto') {
            classes.push('grid-cols-1');
            if (responsive) {
                classes.push('sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4');
            }
        }
        else if (columns === 'fit') {
            classes.push('grid-cols-[repeat(auto-fit,minmax(250px,1fr))]');
        }
        // Gap classes
        const gapClasses = {
            none: 'gap-0',
            sm: 'gap-2',
            md: 'gap-4',
            lg: 'gap-6',
            xl: 'gap-8'
        };
        classes.push(gapClasses[gap]);
        // Layout-specific classes
        if (layout) {
            if (layout.padding) {
                const paddingClasses = {
                    none: 'p-0',
                    sm: 'p-2',
                    md: 'p-4',
                    lg: 'p-6',
                    xl: 'p-8'
                };
                classes.push(paddingClasses[layout.padding]);
            }
            if (layout.margin) {
                const marginClasses = {
                    none: 'm-0',
                    sm: 'm-2',
                    md: 'm-4',
                    lg: 'm-6',
                    xl: 'm-8'
                };
                classes.push(marginClasses[layout.margin]);
            }
            // Responsive overrides
            if (layout.responsive) {
                if (layout.responsive.sm?.columns) {
                    classes.push(`sm:grid-cols-${layout.responsive.sm.columns}`);
                }
                if (layout.responsive.md?.columns) {
                    classes.push(`md:grid-cols-${layout.responsive.md.columns}`);
                }
                if (layout.responsive.lg?.columns) {
                    classes.push(`lg:grid-cols-${layout.responsive.lg.columns}`);
                }
                if (layout.responsive.xl?.columns) {
                    classes.push(`xl:grid-cols-${layout.responsive.xl.columns}`);
                }
            }
        }
        return clsx(classes, getAnimationClasses(animation), className);
    }, [columns, gap, responsive, layout, animation, className]);
    return (_jsx("div", { className: gridClasses, children: children }));
};
