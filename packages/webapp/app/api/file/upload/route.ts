import { validateSession } from '@/lib/n8n/utils';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
 
export async function POST(request: NextRequest): Promise<NextResponse> {
  const {isValid} = await validateSession(request);
    if (!isValid) {
      console.log('GET /file upload - Invalid session');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  const body = (await request.json()) as HandleUploadBody;
 
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname,
        /* clientPayload */
      ) => {
        // Generate a client token for the browser to upload the file
        // Otherwise, you're allowing anonymous uploads.
 
        return {
          //allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          addRandomSuffix: true,
          // callbackUrl: 'https://example.com/api/avatar/upload',
          // optional, `callbackUrl` is automatically computed when hosted on Vercel
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            // you could pass a user id from auth, or a value from clientPayload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Called by Vercel API on client upload completion
        // Use tools like ngrok if you want this to work locally
 
        console.log('blob upload completed', blob, tokenPayload);
 
        try {
          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });
        } catch (error) {
          throw new Error('Could not update user');
        }
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // The webhook will retry 5 times waiting for a 200
    );
  }
}