#!/usr/bin/env node
import cron from 'node-cron';
import { db } from '../lib/db';
import { getNextScheduledUpload } from '../lib/pipeline';
import { uploadVideo, postComment, getVideoUrl } from '../lib/youtube';
import { formatYouTubeDescription } from '../lib/caption-generator';

const SCHEDULE_TIME_1 = process.env.SCHEDULE_TIME_1 || '13:00';
const SCHEDULE_TIME_2 = process.env.SCHEDULE_TIME_2 || '21:00';

async function processScheduledUploads() {
  console.log('[Worker] Checking for scheduled uploads...');

  try {
    const upload = await getNextScheduledUpload();

    if (!upload) {
      console.log('[Worker] No uploads scheduled at this time');
      return;
    }

    console.log(`[Worker] Processing upload for clip ${upload.clip_id}`);

    await db.query(
      `UPDATE uploads SET status = 'uploading' WHERE id = $1`,
      [upload.id]
    );

    // Prepare metadata
    const description = formatYouTubeDescription({
      title: upload.title,
      caption: upload.caption,
      hashtags: upload.hashtags,
      description: upload.transcript
    });

    // Upload to YouTube
    const videoId = await uploadVideo(upload.file_path, {
      title: upload.title,
      description,
      tags: upload.hashtags,
      categoryId: '22', // People & Blogs
      privacyStatus: 'public',
      thumbnailPath: upload.thumbnail_path
    });

    const videoUrl = await getVideoUrl(videoId);

    // Update upload record
    await db.query(
      `UPDATE uploads SET
        status = 'uploaded',
        video_id = $1,
        url = $2,
        uploaded_at = NOW()
       WHERE id = $3`,
      [videoId, videoUrl, upload.id]
    );

    console.log(`[Worker] Video uploaded: ${videoUrl}`);

    // Post comment
    try {
      await postComment(videoId);
      await db.query(
        `UPDATE uploads SET comment_posted = true WHERE id = $1`,
        [upload.id]
      );
      console.log('[Worker] Engagement comment posted');
    } catch (error: any) {
      console.error('[Worker] Failed to post comment:', error.message);
    }

    await db.logActivity('video_uploaded', {
      uploadId: upload.id,
      clipId: upload.clip_id,
      videoId,
      url: videoUrl
    }, 'success');

  } catch (error: any) {
    console.error('[Worker] Upload failed:', error.message);

    await db.logActivity('upload_error', {
      error: error.message
    }, 'error', error.message);
  }
}

async function initializeWorker() {
  console.log('[Worker] Initializing database...');
  await db.initialize();
  console.log('[Worker] Database ready');

  console.log(`[Worker] Scheduled upload times: ${SCHEDULE_TIME_1}, ${SCHEDULE_TIME_2}`);

  // Check every minute for uploads due
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledUploads();
    } catch (error: any) {
      console.error('[Worker] Cron job error:', error.message);
    }
  });

  console.log('[Worker] Cron scheduler started');

  // Manual trigger check on startup
  setTimeout(() => processScheduledUploads(), 5000);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});

// Start worker
initializeWorker().catch(error => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
