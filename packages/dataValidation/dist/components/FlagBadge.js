// === FlagBadge.tsx ===
// Created: 2025-07-19
// Purpose: Display a colored badge based on anomaly status
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { AnomalyStatus } from '../types';
export const FlagBadge = ({ status }) => {
    const colorMap = {
        [AnomalyStatus.Same]: 'bg-green-100 text-green-800',
        [AnomalyStatus.Similar]: 'bg-yellow-100 text-yellow-800',
        [AnomalyStatus.Different]: 'bg-red-100 text-red-800'
    };
    return (_jsx("span", { className: `px-2 py-1 rounded ${colorMap[status]} text-sm font-semibold`, children: status.toUpperCase() }));
};
