import { getAuthorizationUrl } from '@/lib/hubspot';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the requested scopes from the query parameters, or use defaults
    // const scopes = request.nextUrl.searchParams.get('scopes')?.split(',') || [
    const scopes = [
      'oauth',
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write',
      'crm.schemas.companies.read',
      'crm.schemas.contacts.read',
      'crm.objects.custom.read',
      'crm.schemas.custom.read',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'crm.schemas.deals.read',
      'crm.objects.owners.read',
      
    ];
    
    // Generate the HubSpot OAuth authorization URL
    const authUrl = await getAuthorizationUrl(
      process.env.HUBSPOT_CLIENT_ID as string,
      process.env.HUBSPOT_REDIRECT_URI as string,
      scopes
    );

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error getting HubSpot auth URL:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
