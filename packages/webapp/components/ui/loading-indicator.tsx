import React, { forwardRef, useMemo } from "react";

/**
 * Ennube <LoadingIndicator />
 * Modern, clean, beautiful loading animations for ennube.ai
 * - Variants: "spinner", "dots", "bar", "ring", "orbit", "grid", "skeleton"
 * - TailwindCSS + TypeScript + React (single-file, drop-in)
 * - Accessible (role="status", aria-live), respects reduced motion
 *
 * Usage:
 * <LoadingIndicator variant="spinner" size="md" label="Loading" />
 * <LoadingIndicator variant="dots" dots={4} label="Syncing data" />
 * <LoadingIndicator variant="bar" gradientFrom="#00C2FF" gradientTo="#6C47FF" />
 * <LoadingIndicator variant="orbit" />
 * <LoadingIndicator variant="grid" />
 * <LoadingIndicator variant="skeleton" className="h-10 w-full rounded-xl" />
 */

export type LoadingVariant =
  | "spinner"
  | "dots"
  | "bar"
  | "ring"
  | "orbit"
  | "grid"
  | "skeleton";

export type LoadingSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface LoadingIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LoadingVariant;
  size?: LoadingSize;
  /** Optional descriptive label for screen readers and optional visual label */
  label?: string;
  /** Show the label visually next to/under the indicator */
  showLabel?: boolean;
  /** Number of dots for the "dots" variant */
  dots?: number;
  /** Hex/RGB/HSL color for foreground accent (for spinner, ring, dots, orbit) */
  color?: string;
  /** Gradient colors for the bar variant */
  gradientFrom?: string;
  gradientTo?: string;
  /** If true, renders a compact inline layout */
  inline?: boolean;
}

const SIZE_MAP: Record<LoadingSize, number> = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 40,
};

const clampDots = (n?: number) => Math.min(Math.max(n ?? 3, 2), 8);

export const LoadingIndicator = forwardRef<HTMLDivElement, LoadingIndicatorProps>(
  (
    {
      variant = "spinner",
      size = "md",
      label = "Loading",
      showLabel = false,
      dots = 3,
      color,
      gradientFrom = "#22d3ee", // cyan-400
      gradientTo = "#a78bfa", // violet-400
      inline = false,
      className = "",
      ...rest
    },
    ref
  ) => {
    const px = SIZE_MAP[size];

    const commonSrLabel = (
      <span className={showLabel ? "ml-2 text-sm text-muted-foreground" : "sr-only"}>
        {label}
      </span>
    );

    const fg = color ?? "currentColor";

    const content = useMemo(() => {
      switch (variant) {
        case "spinner":
          return (
            <div className="relative" style={{ width: px, height: px }}>
              <div
                className="animate-spin rounded-full border-2 border-muted-foreground/30"
                style={{ width: px, height: px, borderTopColor: fg }}
              />
            </div>
          );
        case "ring":
          return (
            <div className="relative" style={{ width: px, height: px }}>
              <div
                className="absolute inset-0 rounded-full border-2 opacity-20"
                style={{ borderColor: fg }}
              />
              <div
                className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: fg }}
              />
            </div>
          );
        case "dots": {
          const n = clampDots(dots);
          const gap = Math.max(4, Math.floor(px / 6));
          const dot = Math.max(4, Math.floor(px / 5));
          return (
            <div className="flex items-end" style={{ gap }}>
              {Array.from({ length: n }).map((_, i) => (
                <span
                  key={i}
                  className="block rounded-full will-change-transform"
                  style={{
                    width: dot,
                    height: dot,
                    background: fg,
                    animation: `ennube-bounce 1s cubic-bezier(.2,.6,.35,1) infinite`,
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>
          );
        }
        case "bar":
          return (
            <div
              className="w-56 max-w-full overflow-hidden rounded-full h-2 bg-muted/40"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={label}
            >
              <div
                className="h-full w-1/3 rounded-full will-change-transform"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
                  backgroundSize: "200% 100%",
                  animation: "ennube-slide 1.4s ease-in-out infinite",
                }}
              />
            </div>
          );
        case "orbit": {
          const r = px / 2;
          const dot = Math.max(4, Math.floor(px / 6));
          return (
            <div className="relative" style={{ width: px, height: px }}>
              <div
                className="absolute inset-0 rounded-full border opacity-20"
                style={{ borderColor: fg }}
              />
              <div
                className="absolute inset-0 animate-[spin_1.2s_linear_infinite]"
                style={{ transformOrigin: "center" }}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: dot,
                    height: dot,
                    background: fg,
                    position: "absolute",
                    left: r - dot / 2,
                    top: -dot / 2,
                  }}
                />
              </div>
            </div>
          );
        }
        case "grid": {
          const cell = Math.max(4, Math.floor(px / 3.2));
          const gap = Math.max(3, Math.floor(px / 12));
          const delays = [0, 0.1, 0.2, 0.1, 0.2, 0.3, 0.2, 0.3, 0.4];
          return (
            <div
              className="grid grid-cols-3"
              style={{ gap, width: cell * 3 + gap * 2, height: cell * 3 + gap * 2 }}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <span
                  key={i}
                  className="block rounded-md"
                  style={{
                    width: cell,
                    height: cell,
                    background: fg,
                    opacity: 0.25,
                    animation: `ennube-fade 1.2s ease-in-out infinite`,
                    animationDelay: `${delays[i]}s`,
                  }}
                />
              ))}
            </div>
          );
        }
        case "skeleton":
          return (
            <div className="relative overflow-hidden bg-muted/60" style={{ height: Math.max(8, px / 2) }}>
              <div
                className="absolute inset-0 -translate-x-full will-change-transform"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%)",
                  animation: "ennube-shimmer 1.4s ease-in-out infinite",
                }}
              />
            </div>
          );
        default:
          return null;
      }
    }, [variant, px, fg, dots, gradientFrom, gradientTo, label]);

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={label}
        className={
          "text-foreground/80 " +
          (inline ? "inline-flex items-center" : "flex items-center justify-center flex-col gap-2 ") +
          (className ? ` ${className}` : "")
        }
        {...rest}
      >
        {content}
        {commonSrLabel}
        {/* Inline keyframes so this file stands alone */}
        <style>
          {`
            @media (prefers-reduced-motion: reduce) {
              .animate-spin, .will-change-transform { animation: none !important; }
            }
            @keyframes ennube-bounce {
              0%, 80%, 100% { transform: translateY(0); opacity: .55; }
              40% { transform: translateY(-30%); opacity: 1; }
            }
            @keyframes ennube-slide {
              0%   { transform: translateX(-66%); background-position: 0% 50%; }
              50%  { transform: translateX(66%);  background-position: 100% 50%; }
              100% { transform: translateX(200%); background-position: 0% 50%; }
            }
            @keyframes ennube-fade {
              0%, 100% { opacity: .25; }
              50%      { opacity: 1; }
            }
            @keyframes ennube-shimmer {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}
        </style>
      </div>
    );
  }
);

LoadingIndicator.displayName = "LoadingIndicator";

export default LoadingIndicator;
