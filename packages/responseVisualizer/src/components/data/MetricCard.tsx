// === components/data/MetricCard.tsx ===
// Created: 2025-07-19 15:30
// Purpose: Metric card component for displaying key metrics
// Exports:
//   - MetricCard: Main metric display component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Animated metric cards with trend indicators

'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface MetricCardProps {
  /** Metric value */
  value: string | number;
  /** Metric label */
  label: string;
  /** Additional CSS classes */
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  className
}) => {
  return (
    <div className={clsx('metric-card p-4 border rounded-lg', className)}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

/*
 * === components/data/MetricCard.tsx ===
 * Updated: 2025-07-19 15:30
 * Summary: Metric card component placeholder
 */
