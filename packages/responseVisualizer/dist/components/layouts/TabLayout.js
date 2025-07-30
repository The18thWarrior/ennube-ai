// === components/layouts/TabLayout.tsx ===
// Created: 2025-07-19 15:20
// Purpose: Tab layout component for organizing content in tabbed interface
// Exports:
//   - TabLayout: Main tabbed container component
//   - TabPanel: Individual tab panel component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Accessible tabs with keyboard navigation
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { getAnimationClasses, getHoverAnimationClasses } from '../../utils/animation-utils';
/**
 * Individual tab button component
 */
const TabButton = ({ tab, isActive, variant, size, onClick }) => {
    const buttonClasses = React.useMemo(() => {
        const baseClasses = [
            'flex items-center gap-2 font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        ];
        // Size classes
        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg'
        };
        baseClasses.push(sizeClasses[size || 'md']);
        // Variant classes
        switch (variant) {
            case 'pills':
                baseClasses.push('rounded-full', isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground');
                break;
            case 'underline':
                baseClasses.push('border-b-2 rounded-none', isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground');
                break;
            case 'card':
                baseClasses.push('rounded-t-lg border border-b-0', isActive
                    ? 'bg-background text-foreground border-border'
                    : 'bg-muted text-muted-foreground border-transparent hover:bg-background/50');
                break;
            default:
                baseClasses.push('rounded-md', isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground');
        }
        if (tab.disabled) {
            baseClasses.push('opacity-50 cursor-not-allowed');
        }
        else {
            baseClasses.push('cursor-pointer', getHoverAnimationClasses('glow'));
        }
        return clsx(baseClasses);
    }, [tab.disabled, isActive, variant, size]);
    return (_jsxs("button", { className: buttonClasses, onClick: onClick, disabled: tab.disabled, role: "tab", "aria-selected": isActive, "aria-controls": `panel-${tab.id}`, id: `tab-${tab.id}`, children: [tab.icon && _jsx("span", { className: "flex-shrink-0", children: tab.icon }), _jsx("span", { children: tab.label })] }));
};
/**
 * Tab panel component
 */
export const TabPanel = ({ tab, isActive, animation }) => {
    if (!isActive)
        return null;
    return (_jsx("div", { className: clsx('tab-panel', getAnimationClasses(animation)), role: "tabpanel", "aria-labelledby": `tab-${tab.id}`, id: `panel-${tab.id}`, children: tab.content }));
};
/**
 * Main tab layout component
 */
export const TabLayout = ({ tabs, defaultTab, position = 'top', variant = 'default', size = 'md', fullWidth = false, className, onTabChange, animation, layout }) => {
    const [activeTab, setActiveTab] = useState(() => defaultTab || tabs[0]?.id || '');
    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        onTabChange?.(tabId);
    }, [onTabChange]);
    // Generate container classes
    const containerClasses = React.useMemo(() => {
        const classes = ['tab-layout'];
        // Position classes
        if (position === 'left' || position === 'right') {
            classes.push('flex');
            if (position === 'left') {
                classes.push('flex-row');
            }
            else {
                classes.push('flex-row-reverse');
            }
        }
        else {
            classes.push('flex flex-col');
            if (position === 'bottom') {
                classes.push('flex-col-reverse');
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
        }
        return clsx(classes, getAnimationClasses(animation), className);
    }, [position, layout, animation, className]);
    // Generate tab list classes
    const tabListClasses = React.useMemo(() => {
        const classes = ['flex'];
        if (position === 'top' || position === 'bottom') {
            classes.push('flex-row');
            if (fullWidth) {
                classes.push('w-full');
            }
        }
        else {
            classes.push('flex-col min-w-0');
        }
        // Variant-specific container styling
        if (variant === 'card') {
            classes.push('border-b border-border');
        }
        return clsx(classes);
    }, [position, fullWidth, variant]);
    // Generate tab button wrapper classes
    const tabButtonClasses = React.useMemo(() => {
        if (fullWidth && (position === 'top' || position === 'bottom')) {
            return 'flex-1';
        }
        return '';
    }, [fullWidth, position]);
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return (_jsxs("div", { className: containerClasses, children: [_jsx("div", { className: tabListClasses, role: "tablist", "aria-orientation": position === 'left' || position === 'right' ? 'vertical' : 'horizontal', children: tabs.map((tab) => (_jsx("div", { className: tabButtonClasses, children: _jsx(TabButton, { tab: tab, isActive: activeTab === tab.id, variant: variant, size: size, onClick: () => handleTabChange(tab.id) }) }, tab.id))) }), _jsx("div", { className: "tab-content flex-1 min-h-0", children: currentTab && (_jsx(TabPanel, { tab: currentTab, isActive: true, animation: animation })) })] }));
};
