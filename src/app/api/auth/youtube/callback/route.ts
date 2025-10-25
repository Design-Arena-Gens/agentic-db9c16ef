import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCode } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    const tokens = await getTokenFromCode(code);

    // Display tokens to user for manual .env update
    return new NextResponse(
      `<html>
        <head>
          <title>YouTube Authorization Success</title>
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; }
            code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>✅ YouTube Authorization Successful</h1>
          <p>Add this refresh token to your <code>.env</code> file:</p>
          <pre>YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
          <p>Then restart your application.</p>
          <a href="/">← Back to Dashboard</a>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error: any) {
    console.error('YouTube callback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
