import { NextRequest, NextResponse } from 'next/server';
import { getLogsByUserIdAndTimeframe } from '@/lib/db/log-storage';
import { auth } from '@/auth';

/**
 * API endpoint to get monthly record operations totals
 * @route GET /api/billing/monthly-usage
 */
export async function GET(req: NextRequest) {
  try {
    // Ensure user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters for year and month
    const url = new URL(req.url);
    const yearParam = url.searchParams.get('year');
    const monthParam = url.searchParams.get('month');

    // Use current date if not provided
    const currentDate = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : currentDate.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : currentDate.getMonth();

    // Get the user ID from session
    const userId = (session.user as any).auth0?.sub || session.user.id || session.user.email;
    if (!userId) {
      return NextResponse.json(
        { error: 'User identifier not found' },
        { status: 400 }
      );
    }

    // Calculate start and end timestamps for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    // Get logs for the user within the timeframe
    const logs = await getLogsByUserIdAndTimeframe(userId, startTime, endTime);

    // Calculate total usage as sum of credits
    const total = logs.reduce((sum, log) => sum + log.credits, 0);

    // Return the total
    return NextResponse.json({ total, year, month });
  } catch (error) {
    console.log('Error getting monthly record operations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly record operations' },
      { status: 500 }
    );
  }
}
