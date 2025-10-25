import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const [episodes, clips, scheduled, uploaded] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM episodes`),
      db.query(`SELECT COUNT(*) FROM clips`),
      db.query(`SELECT COUNT(*) FROM uploads WHERE status = 'scheduled'`),
      db.query(`
        SELECT COUNT(*) FROM uploads
        WHERE status = 'uploaded'
        AND uploaded_at >= CURRENT_DATE
      `),
    ]);

    return NextResponse.json({
      totalEpisodes: parseInt(episodes.rows[0].count),
      totalClips: parseInt(clips.rows[0].count),
      scheduledUploads: parseInt(scheduled.rows[0].count),
      uploadedToday: parseInt(uploaded.rows[0].count),
    });
  } catch (error: any) {
    console.error('Fetch stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
