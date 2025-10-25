import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await db.query(`
      SELECT
        id, title, caption, duration, score, status, created_at, hashtags
      FROM clips
      ORDER BY created_at DESC
      LIMIT 50
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Fetch clips error:', error);
    return NextResponse.json({ error: 'Failed to fetch clips' }, { status: 500 });
  }
}
