// === components/layouts/FlexLayout.tsx ===
// Created: 2025-07-19 15:15
// Purpose: Flexible layout component for arranging content with flexbox
// Exports:
//   - FlexLayout: Main flex container component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Full flexbox support with responsive behavior
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { clsx } from 'clsx';
import { getAnimationClasses } from '../../utils/animation-utils';
/**
 * Flexible layout component using CSS Flexbox
 */
export const FlexLayout = ({ direction = 'row', justify = 'start', align = 'start', wrap = 'nowrap', gap = 'md', responsive = true, className, children, animation, layout }) => {
    // Generate flex classes
    const flexClasses = React.useMemo(() => {
        const classes = ['flex'];
        // Direction classes
        const directionClasses = {
            row: 'flex-row',
            col: 'flex-col',
            'row-reverse': 'flex-row-reverse',
            'col-reverse': 'flex-col-reverse'
        };
        classes.push(directionClasses[direction]);
        // Justify content classes
        const justifyClasses = {
            start: 'justify-start',
            end: 'justify-end',
            center: 'justify-center',
            between: 'justify-between',
            around: 'justify-around',
            evenly: 'justify-evenly'
        };
        classes.push(justifyClasses[justify]);
        // Align items classes
        const alignClasses = {
            start: 'items-start',
            end: 'items-end',
            center: 'items-center',
            baseline: 'items-baseline',
            stretch: 'items-stretch'
        };
        classes.push(alignClasses[align]);
        // Wrap classes
        const wrapClasses = {
            nowrap: 'flex-nowrap',
            wrap: 'flex-wrap',
            'wrap-reverse': 'flex-wrap-reverse'
        };
        classes.push(wrapClasses[wrap]);
        // Gap classes
        const gapClasses = {
            none: 'gap-0',
            sm: 'gap-2',
            md: 'gap-4',
            lg: 'gap-6',
            xl: 'gap-8'
        };
        classes.push(gapClasses[gap]);
        // Responsive breakpoints
        if (responsive) {
            // Auto-responsive behavior for mobile-first design
            if (direction === 'row') {
                classes.push('flex-col sm:flex-row');
            }
        }
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
                Object.entries(layout.responsive).forEach(([breakpoint, config]) => {
                    if (config?.gap) {
                        const gapClass = {
                            none: 'gap-0',
                            sm: 'gap-2',
                            md: 'gap-4',
                            lg: 'gap-6',
                            xl: 'gap-8'
                        }[config.gap];
                        classes.push(`${breakpoint}:${gapClass}`);
                    }
                });
            }
        }
        return clsx(classes, getAnimationClasses(animation), className);
    }, [direction, justify, align, wrap, gap, responsive, layout, animation, className]);
    return (_jsx("div", { className: flexClasses, children: children }));
};
/**
 * Flex item component for child elements
 */
export const FlexItem = ({ grow = 0, shrink = 1, basis = 'auto', alignSelf = 'auto', className, children }) => {
    const itemClasses = React.useMemo(() => {
        const classes = [];
        // Grow classes
        if (grow > 0) {
            classes.push(grow === 1 ? 'flex-grow' : `flex-grow-${grow}`);
        }
        // Shrink classes
        if (shrink === 0) {
            classes.push('flex-shrink-0');
        }
        else if (shrink !== 1) {
            classes.push(`flex-shrink-${shrink}`);
        }
        // Basis classes
        const basisClasses = {
            auto: 'flex-auto',
            full: 'flex-1',
            '1/2': 'flex-1/2',
            '1/3': 'flex-1/3',
            '2/3': 'flex-2/3',
            '1/4': 'flex-1/4',
            '3/4': 'flex-3/4'
        };
        if (basis !== 'auto') {
            classes.push(basisClasses[basis]);
        }
        // Align self classes
        const alignSelfClasses = {
            auto: 'self-auto',
            start: 'self-start',
            end: 'self-end',
            center: 'self-center',
            baseline: 'self-baseline',
            stretch: 'self-stretch'
        };
        if (alignSelf !== 'auto') {
            classes.push(alignSelfClasses[alignSelf]);
        }
        return clsx(classes, className);
    }, [grow, shrink, basis, alignSelf, className]);
    return (_jsx("div", { className: itemClasses, children: children }));
};
