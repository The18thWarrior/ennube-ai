import { NextResponse } from 'next/server';
import { getMicrosoftCredentialsForUser, upsertMicrosoftCredentials } from '@/lib/db/microsoft-storage';
import { refreshAccessToken, createGraphClient } from '@/lib/microsoft';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
      if (!session?.user?.auth0?.sub) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
  }
  const userId = session.user.auth0.sub;
  if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const creds = await getMicrosoftCredentialsForUser(userId);
  if (!creds) return NextResponse.json({ error: 'no_credentials' }, { status: 400 });

  let accessToken = creds.access_token;
  try {
    if (!accessToken || (creds.expires_at && new Date(creds.expires_at).getTime() < Date.now())) {
      const refreshed = await refreshAccessToken({ refreshToken: creds.refresh_token || '' });
      accessToken = refreshed.accessToken;
      await upsertMicrosoftCredentials(userId, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt || null,
        raw: refreshed.raw,
      });
    }
  } catch (err) {
    console.error('Error refreshing microsoft token', err);
    return NextResponse.json({ error: 'token_refresh_failed' }, { status: 500 });
  }

  const body = await request.json();
  const { to, subject, body: messageBody } = body;
  if (!to || !subject || !messageBody) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const client = createGraphClient({ accessToken });
  try {
    const mail = {
      message: {
        subject,
        body: {
          contentType: 'Text',
          content: messageBody,
        },
        toRecipients: to.map((email: string) => ({ emailAddress: { address: email } })),
      },
    };
    await client.api('/me/sendMail').post(mail);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Graph sendMail error', err);
    return NextResponse.json({ error: 'graph_error' }, { status: 500 });
  }
}
