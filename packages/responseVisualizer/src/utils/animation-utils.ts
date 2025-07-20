// === utils/animation-utils.ts ===
// Created: 2025-07-19 14:35
// Purpose: Animation utilities for component transitions and effects
// Exports:
//   - getAnimationClasses: Generate Tailwind animation classes
//   - createTransition: Create CSS transition configurations
//   - animationPresets: Pre-defined animation configurations
// Interactions:
//   - Used by: All animated components
// Notes:
//   - Uses Tailwind CSS classes for animations

import { AnimationConfig } from '../types';
import { clsx } from 'clsx';

/**
 * Animation preset configurations
 */
export const animationPresets: Record<string, AnimationConfig> = {
  subtle: {
    type: 'fade',
    duration: 200,
    delay: 0
  },
  smooth: {
    type: 'slide',
    duration: 300,
    delay: 0
  },
  bounce: {
    type: 'bounce',
    duration: 500,
    delay: 0
  },
  loading: {
    type: 'pulse',
    duration: 1000,
    repeat: true
  },
  spinner: {
    type: 'spin',
    duration: 1000,
    repeat: true
  }
};

/**
 * Generate Tailwind animation classes based on animation config
 */
export function getAnimationClasses(animation?: AnimationConfig): string {
  if (!animation || animation.type === 'none') {
    return '';
  }

  const classes: string[] = [];
  
  // Base animation classes
  switch (animation.type) {
    case 'fade':
      classes.push('animate-in', 'fade-in');
      break;
    case 'slide':
      classes.push('animate-in', 'slide-in-from-bottom-4');
      break;
    case 'bounce':
      classes.push('animate-bounce');
      break;
    case 'pulse':
      classes.push('animate-pulse');
      break;
    case 'spin':
      classes.push('animate-spin');
      break;
  }

  // Duration classes
  if (animation.duration) {
    if (animation.duration <= 150) {
      classes.push('duration-150');
    } else if (animation.duration <= 200) {
      classes.push('duration-200');
    } else if (animation.duration <= 300) {
      classes.push('duration-300');
    } else if (animation.duration <= 500) {
      classes.push('duration-500');
    } else if (animation.duration <= 700) {
      classes.push('duration-700');
    } else {
      classes.push('duration-1000');
    }
  }

  // Delay classes
  if (animation.delay) {
    if (animation.delay <= 75) {
      classes.push('delay-75');
    } else if (animation.delay <= 100) {
      classes.push('delay-100');
    } else if (animation.delay <= 150) {
      classes.push('delay-150');
    } else if (animation.delay <= 200) {
      classes.push('delay-200');
    } else if (animation.delay <= 300) {
      classes.push('delay-300');
    } else if (animation.delay <= 500) {
      classes.push('delay-500');
    } else {
      classes.push('delay-700');
    }
  }

  // Easing
  classes.push('ease-in-out');

  return clsx(classes);
}

/**
 * Create CSS transition configuration
 */
export function createTransition(animation?: AnimationConfig): React.CSSProperties {
  if (!animation || animation.type === 'none') {
    return {};
  }

  const duration = animation.duration || 300;
  const delay = animation.delay || 0;

  return {
    transition: `all ${duration}ms ease-in-out`,
    transitionDelay: `${delay}ms`
  };
}

/**
 * Get loading animation classes for different loading types
 */
export function getLoadingAnimationClasses(type: 'spinner' | 'skeleton' | 'dots' | 'pulse' = 'spinner'): string {
  switch (type) {
    case 'spinner':
      return 'animate-spin';
    case 'skeleton':
      return 'animate-pulse bg-muted';
    case 'dots':
      return 'animate-bounce';
    case 'pulse':
      return 'animate-pulse';
    default:
      return 'animate-pulse';
  }
}

/**
 * Generate staggered animation delays for list items
 */
export function getStaggeredDelay(index: number, baseDelay: number = 50): string {
  const delay = index * baseDelay;
  
  if (delay <= 75) return 'delay-75';
  if (delay <= 100) return 'delay-100';
  if (delay <= 150) return 'delay-150';
  if (delay <= 200) return 'delay-200';
  if (delay <= 300) return 'delay-300';
  if (delay <= 500) return 'delay-500';
  return 'delay-700';
}

/**
 * Create hover animation classes
 */
export function getHoverAnimationClasses(type: 'lift' | 'glow' | 'scale' | 'none' = 'lift'): string {
  switch (type) {
    case 'lift':
      return 'transition-transform duration-200 hover:scale-105 hover:shadow-lg';
    case 'glow':
      return 'transition-shadow duration-200 hover:shadow-md hover:shadow-primary/25';
    case 'scale':
      return 'transition-transform duration-200 hover:scale-110';
    case 'none':
      return '';
    default:
      return 'transition-transform duration-200 hover:scale-105';
  }
}

/**
 * Create focus animation classes for accessibility
 */
export function getFocusAnimationClasses(): string {
  return 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200';
}

/*
 * === utils/animation-utils.ts ===
 * Updated: 2025-07-19 14:35
 * Summary: Animation utilities using Tailwind CSS classes
 * Key Components:
 *   - getAnimationClasses(): Convert animation config to Tailwind classes
 *   - animationPresets: Common animation configurations
 *   - getLoadingAnimationClasses(): Loading-specific animations
 * Dependencies:
 *   - Requires: clsx, Tailwind CSS animate classes
 * Version History:
 *   v1.0 – initial animation utilities with Tailwind integration
 * Notes:
 *   - Optimized for Tailwind CSS animation classes
 *   - Supports staggered animations for lists
 */
