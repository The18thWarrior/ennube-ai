import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyRecordOperationsTotal } from '@/lib/usage-logs';
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

    // Get the monthly record operations total
    const total = await getMonthlyRecordOperationsTotal(year, month);

    // Return the total
    return NextResponse.json({ total, year, month });
  } catch (error) {
    console.error('Error getting monthly record operations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly record operations' },
      { status: 500 }
    );
  }
}
