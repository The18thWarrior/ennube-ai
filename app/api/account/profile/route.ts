import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile, updateUserProfile } from '@/lib/db/account-storage';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    
    if (!userSub) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const profile = await getUserProfile(userSub, session);
    
    if (!profile) {
      // If no profile exists, return default values from session
      return NextResponse.json({
        name: session.user.name || '',
        email: session.user.email || '',
        company: '',
        jobRole: '',
      });
    }

    return NextResponse.json({
      name: profile.name,
      email: profile.email,
      company: profile.company,
      jobRole: profile.jobRole,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    
    if (!userSub) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const payload = await request.json();
    const { name, company, jobRole } = payload;

    // Check if profile exists, if not create a new one
    const existingProfile = await getUserProfile(userSub, session);
    
    if (!existingProfile) {
      // Create new profile
      const success = await saveUserProfile(userSub, {
        name: name || session.user.name || '',
        email: session.user.email || '',
        company: company || '',
        jobRole: jobRole || '',
      });

      if (!success) {
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
    } else {
      // Update existing profile
      const success = await updateUserProfile(userSub, {
        name,
        company,
        jobRole,
      });

      if (!success) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
    }

    return NextResponse.json({
      name: name || existingProfile?.name || session.user.name || '',
      email: session.user.email,
      company: company || existingProfile?.company || '',
      jobRole: jobRole || existingProfile?.jobRole || '',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile data' }, { status: 500 });
  }
}
