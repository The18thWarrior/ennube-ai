// === utils.ts ===
// Created: 2025-07-26  
// Purpose: Utility functions for n8n integration, including header validation
// Exports:
//   - validateHeader
// Interactions:
//   - Used by: n8n API routes
// Notes:
//   - Validates Basic Auth header against env var
'use server';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getBaseUrl } from '../chat/helper';




/**
 * === utils.ts ===
 * Updated: 2025-07-26
 * Summary: Utility for validating Basic Auth header in Next.js API routes.
 * Key Components:
 *   - validateHeader(): Checks Basic Auth against env var
 * Dependencies:
 *   - NextRequest, process.env, crypto
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Only supports single static credential
 */
