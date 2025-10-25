import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `
      SELECT
        u.id, u.clip_id, u.platform, u.scheduled_time, u.status,
        u.url, u.uploaded_at, c.title
      FROM uploads u
      JOIN clips c ON u.clip_id = c.id
    `;

    if (upcoming) {
      query += ` WHERE u.status = 'scheduled' AND u.scheduled_time > NOW()`;
    }

    query += ` ORDER BY u.scheduled_time DESC LIMIT ${limit}`;

    const result = await db.query(query);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Fetch schedule error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clipId, scheduledTime } = await request.json();

    if (!clipId || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing clipId or scheduledTime' },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO uploads (clip_id, platform, scheduled_time, status)
       VALUES ($1, $2, $3, $4)`,
      [clipId, 'youtube', scheduledTime, 'scheduled']
    );

    await db.logActivity('clip_scheduled', { clipId, scheduledTime }, 'success');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Schedule error:', error);
    return NextResponse.json({ error: 'Failed to schedule clip' }, { status: 500 });
  }
}
