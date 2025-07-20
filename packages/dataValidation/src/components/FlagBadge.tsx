// === FlagBadge.tsx ===
// Created: 2025-07-19
// Purpose: Display a colored badge based on anomaly status
'use client'
import React from 'react';
import { AnomalyStatus } from '../types';

interface FlagBadgeProps {
  status: AnomalyStatus;
}

export const FlagBadge: React.FC<FlagBadgeProps> = ({ status }) => {
  const colorMap = {
    [AnomalyStatus.Same]: 'bg-green-100 text-green-800',
    [AnomalyStatus.Similar]: 'bg-yellow-100 text-yellow-800',
    [AnomalyStatus.Different]: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`px-2 py-1 rounded ${colorMap[status]} text-sm font-semibold`}>  
      {status.toUpperCase()}
    </span>
  );
};

/*
 * === FlagBadge.tsx ===
 * Updated: 2025-07-19
 * Summary: Anomaly status badge
 * Key Components:
 *   - FlagBadge: badge component
 * Dependencies:
 *   - React, AnomalyStatus
 * Version History:
 *   v1.0 – initial
 */
