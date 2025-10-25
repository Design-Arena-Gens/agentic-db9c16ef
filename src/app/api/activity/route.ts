import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const result = await db.query(`
      SELECT id, action, details, status, error_message, created_at
      FROM activity_log
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Fetch activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
