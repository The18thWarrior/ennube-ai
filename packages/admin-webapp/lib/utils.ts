// === utils.ts ===
// Created: 2025-08-29 10:05
// Purpose: Utility functions for the admin webapp
// Exports: cn, formatDate, formatTimestamp, etc.
// Interactions: Used throughout components and pages
// Notes: Includes date formatting, validation helpers, and UI utilities

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * OVERVIEW
 *
 * - Purpose: Provides common utility functions for the admin webapp
 * - Assumptions: Uses Tailwind CSS, handles various date formats
 * - Edge Cases: Null/undefined values, invalid dates, empty strings
 * - How it fits: Foundation utilities used across components
 * - Future Improvements: Add more validation and formatting helpers
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  if (!date) return 'N/A';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Timestamp';
  }
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
}

export function formatJson(obj: any): string {
  if (!obj) return '';
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return 'Invalid JSON';
  }
}

export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return value ? 'Yes' : 'No';
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString();
}

export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  // Remove special characters that could cause SQL issues
  return query.replace(/['"\\;]/g, '').trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function getCurrentTimestamp(): number {
  return Date.now();
}

export function parseJsonSafely<T = any>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
}

/*
 * === utils.ts ===
 * Updated: 2025-08-29 10:05
 * Summary: Utility functions for the admin webapp
 * Key Components:
 *   - cn(): Tailwind class merging
 *   - formatDate/formatTimestamp: Date formatting
 *   - validation helpers
 *   - string utilities
 * Dependencies:
 *   - Requires: clsx, tailwind-merge
 * Version History:
 *   v1.0 – initial utilities
 * Notes:
 *   - Handles edge cases and null values
 *   - Includes debounce and validation helpers
 */
