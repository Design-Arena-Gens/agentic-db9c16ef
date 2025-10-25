import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { processEpisode, scheduleClipsForUpload } from '@/lib/pipeline';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/uploads';

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(process.env.OUTPUT_DIR || '/tmp/outputs', { recursive: true });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filepath = path.join(UPLOAD_DIR, filename);

    await writeFile(filepath, buffer);

    // Process episode
    const result = await processEpisode(filepath, filename);

    // Auto-schedule top 2 clips
    if (result.clipIds.length >= 2) {
      const now = new Date();
      const time1 = new Date(now);
      time1.setHours(parseInt(process.env.SCHEDULE_TIME_1?.split(':')[0] || '13'), 0, 0, 0);
      if (time1 <= now) time1.setDate(time1.getDate() + 1);

      const time2 = new Date(now);
      time2.setHours(parseInt(process.env.SCHEDULE_TIME_2?.split(':')[0] || '21'), 0, 0, 0);
      if (time2 <= now) time2.setDate(time2.getDate() + 1);

      await scheduleClipsForUpload(result.clipIds, [time1, time2]);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
