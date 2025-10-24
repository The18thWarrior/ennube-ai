import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGSuiteCredentialsById } from '@/lib/db/gsuite-storage';
import { createGSuiteClient, SendEmailRequest } from '@/lib/gsuite';

/**
 * POST /api/gsuite/gmail/send
 * Send an email via Gmail
 * 
 * Request body:
 * {
 *   to: string[],         // Array of recipient email addresses
 *   cc?: string[],        // Optional array of CC email addresses
 *   bcc?: string[],       // Optional array of BCC email addresses
 *   subject: string,      // Email subject
 *   body: {
 *     text?: string,      // Plain text content
 *     html?: string       // HTML content
 *   },
 *   attachments?: {
 *     filename: string,
 *     content: string,
 *     encoding: 'base64' | 'binary' | 'utf8',
 *     mimeType: string
 *   }[]                   // Optional attachments
 * }
 * 
 * Response:
 * - 200 OK: Email sent successfully
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
    if (!body || !Array.isArray(body.to) || body.to.length === 0 || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'Invalid request body. Must include to, subject, and body.' },
        { status: 400 }
      );
    }
    
    if (!body.body.text && !body.body.html) {
      return NextResponse.json(
        { error: 'Email body must contain either text or html content' },
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
    
    // Send the email
    const emailRequest: SendEmailRequest = {
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      body: {
        text: body.body.text,
        html: body.body.html
      },
      attachments: body.attachments
    };
    
    const messageId = await gsuiteClient.sendEmail(emailRequest);
    
    return NextResponse.json({
      success: true,
      messageId,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.log('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
