

/*
 * === route.ts ===
 * Updated: 2025-10-04 10:00
 * Summary: API endpoint for memory operations
 * Key Components:
 *   - GET: Get most recent memory case for user/agent
 *   - POST: Update reward score for memory case
 * Dependencies:
 *   - Requires: next-auth, memory service
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Validates user authentication and input
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { memoryService } from '@/lib/memory';

/**
 * OVERVIEW
 *
 * - Purpose: Handle memory-related API operations
 * - Assumptions: User is authenticated; memory learning is enabled
 * - Edge Cases: Invalid case IDs, unauthorized access, database errors
 * - How it fits: Provides REST API for memory reward updates from UI
 * - Future: Add endpoints for memory retrieval, bulk operations
 */

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId, rewardScore } = await request.json();

    // Validate input
    if (!caseId || typeof rewardScore !== 'number') {
      return NextResponse.json(
        { error: 'Missing caseId or invalid rewardScore' },
        { status: 400 }
      );
    }

    // Clamp reward score to 0-1 range
    const clampedScore = Math.max(0, Math.min(1, rewardScore));

    // Update reward score
    const success = await memoryService.updateCaseReward(caseId, clampedScore);

    if (!success) {
      return NextResponse.json(
        { error: 'Case not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reward score updated successfully'
    });

  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userSub = searchParams.get('userSub');
    const agent = searchParams.get('agent');

    if (!userSub || !agent) {
      return NextResponse.json(
        { error: 'Missing userSub or agent parameters' },
        { status: 400 }
      );
    }

    // Get or create profile
    let profile = await memoryService.getProfile(userSub, agent);
    if (!profile) {
      profile = await memoryService.createProfile({ userSub, agentKey: agent, windowSize: 200 });
    }

    // Get the most recent case
    const cases = await memoryService.getCasesByProfile(profile.id, 1);
    const recentCase = cases[0];

    if (!recentCase) {
      return NextResponse.json({ caseId: null, rewardScore: null });
    }

    return NextResponse.json({
      caseId: recentCase.id,
      rewardScore: recentCase.rewardScore
    });

  } catch (error) {
    console.error('Memory GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}