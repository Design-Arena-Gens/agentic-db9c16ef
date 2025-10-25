import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('YouTube auth error:', error);
    return NextResponse.json({ error: 'Failed to initiate YouTube auth' }, { status: 500 });
  }
}
