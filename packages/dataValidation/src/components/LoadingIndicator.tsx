// === LoadingIndicator.tsx ===
// Created: 2025-07-19
// Purpose: Animated loading spinner for data validation components
'use client'
import React from 'react';

export const LoadingIndicator: React.FC = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

/*
 * === LoadingIndicator.tsx ===
 * Updated: 2025-07-19
 * Summary: Spinner component
 * Key Components:
 *   - LoadingIndicator: main spinner
 * Dependencies:
 *   - React
 * Version History:
 *   v1.0 – initial
 */
