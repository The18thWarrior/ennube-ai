import { AnimationConfig } from '../types';
/**
 * Animation preset configurations
 */
export declare const animationPresets: Record<string, AnimationConfig>;
/**
 * Generate Tailwind animation classes based on animation config
 */
export declare function getAnimationClasses(animation?: AnimationConfig): string;
/**
 * Create CSS transition configuration
 */
export declare function createTransition(animation?: AnimationConfig): React.CSSProperties;
/**
 * Get loading animation classes for different loading types
 */
export declare function getLoadingAnimationClasses(type?: 'spinner' | 'skeleton' | 'dots' | 'pulse'): string;
/**
 * Generate staggered animation delays for list items
 */
export declare function getStaggeredDelay(index: number, baseDelay?: number): string;
/**
 * Create hover animation classes
 */
export declare function getHoverAnimationClasses(type?: 'lift' | 'glow' | 'scale' | 'none'): string;
/**
 * Create focus animation classes for accessibility
 */
export declare function getFocusAnimationClasses(): string;
//# sourceMappingURL=animation-utils.d.ts.map