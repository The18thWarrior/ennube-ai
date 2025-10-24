import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGSuiteCredentialsById } from '@/lib/db/gsuite-storage';
import { createGSuiteClient, CreateCalendarEventRequest } from '@/lib/gsuite';

/**
 * POST /api/gsuite/calendar/events
 * Create a new calendar event
 * 
 * Request body:
 * {
 *   summary: string,               // Event title
 *   description?: string,          // Optional event description
 *   location?: string,             // Optional event location
 *   start: {
 *     dateTime: string,            // RFC3339 timestamp
 *     timeZone?: string            // Optional time zone
 *   },
 *   end: {
 *     dateTime: string,            // RFC3339 timestamp
 *     timeZone?: string            // Optional time zone
 *   },
 *   attendees?: {
 *     email: string,
 *     displayName?: string,
 *     optional?: boolean
 *   }[],                           // Optional event attendees
 *   reminders?: {
 *     useDefault?: boolean,
 *     overrides?: {
 *       method: string,
 *       minutes: number
 *     }[]
 *   },
 *   conferenceData?: {
 *     createRequest?: {
 *       requestId?: string,
 *       conferenceSolutionKey?: {
 *         type: string              // 'hangoutsMeet' for Google Meet
 *       }
 *     }
 *   }                              // Optional Google Meet integration
 * }
 * 
 * Response:
 * - 200 OK: Calendar event created successfully
 * - 400 Bad Request: Invalid or missing request body
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: No GSuite credentials found
 * - 500 Internal Server Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body || !body.summary || !body.start || !body.end || 
        !body.start.dateTime || !body.end.dateTime) {
      return NextResponse.json(
        { error: 'Invalid request body. Must include summary, start.dateTime, and end.dateTime.' },
        { status: 400 }
      );
    }
    
    // Get GSuite credentials
    const credentials = await getGSuiteCredentialsById();
    
    if (!credentials || !credentials.accessToken) {
      return NextResponse.json(
        { error: 'No GSuite credentials found - please connect your Google account' },
        { status: 404 }
      );
    }
    
    // Create GSuite client
    const gsuiteClient = createGSuiteClient({
      success: true,
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken || null,
      expiryDate: credentials.expiryDate || null,
      clientId: credentials.clientId || null,
      clientSecret: credentials.clientSecret || null
    });
    
    // Create the calendar event
    const eventRequest: CreateCalendarEventRequest = {
      summary: body.summary,
      description: body.description,
      location: body.location,
      start: body.start,
      end: body.end,
      attendees: body.attendees,
      reminders: body.reminders,
      conferenceData: body.conferenceData
    };
    
    const createdEvent = await gsuiteClient.createCalendarEvent(eventRequest);
    
    return NextResponse.json({
      success: true,
      event: createdEvent,
      message: 'Calendar event created successfully'
    });
  } catch (error) {
    console.log('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
