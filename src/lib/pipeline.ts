import path from 'path';
import fs from 'fs/promises';
import { db } from './db';
import { transcribeAudio, cleanTranscript } from './transcription';
import { detectClips } from './clip-detection';
import { extractClip, addSubtitles, getVideoDuration, extractFrame } from './video-editor';
import { generateCaption, formatYouTubeDescription } from './caption-generator';
import { generateThumbnail } from './thumbnail-generator';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/uploads';
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/tmp/outputs';

export interface ProcessingResult {
  episodeId: number;
  clipsGenerated: number;
  clipIds: number[];
  errors: string[];
}

export async function processEpisode(
  filePath: string,
  filename: string,
  topN: number = 10
): Promise<ProcessingResult> {
  const errors: string[] = [];
  const clipIds: number[] = [];

  try {
    await db.logActivity('process_episode_start', { filename }, 'pending');

    // 1. Insert episode record
    const episodeResult = await db.query(
      `INSERT INTO episodes (filename, file_path, status) VALUES ($1, $2, $3) RETURNING id`,
      [filename, filePath, 'processing']
    );
    const episodeId = episodeResult.rows[0].id;

    // 2. Get video duration
    const duration = await getVideoDuration(filePath);
    await db.query(
      `UPDATE episodes SET duration = $1 WHERE id = $2`,
      [duration, episodeId]
    );

    // 3. Transcribe audio
    await db.logActivity('transcription_start', { episodeId }, 'pending');
    const rawSegments = await transcribeAudio(filePath);
    const segments = cleanTranscript(rawSegments);
    await db.logActivity('transcription_complete', { episodeId, segmentCount: segments.length }, 'success');

    // 4. Detect clips
    await db.logActivity('clip_detection_start', { episodeId }, 'pending');
    const candidates = await detectClips(segments, 60, topN);
    await db.logActivity('clip_detection_complete', {
      episodeId,
      candidatesFound: candidates.length
    }, 'success');

    // 5. Process each clip
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];

      try {
        // Generate paths
        const clipFilename = `clip_${episodeId}_${i + 1}.mp4`;
        const clipPath = path.join(OUTPUT_DIR, clipFilename);
        const tempClipPath = path.join(OUTPUT_DIR, `temp_${clipFilename}`);
        const thumbnailPath = path.join(OUTPUT_DIR, `thumb_${episodeId}_${i + 1}.jpg`);
        const framePath = path.join(OUTPUT_DIR, `frame_${episodeId}_${i + 1}.jpg`);

        // Extract clip
        await extractClip(filePath, tempClipPath, candidate.start, candidate.duration);

        // Add subtitles
        const clipSegments = segments.filter(
          seg => seg.start >= candidate.start && seg.end <= candidate.end
        );
        await addSubtitles(tempClipPath, clipPath, clipSegments, candidate.start, candidate.end);

        // Clean up temp file
        await fs.unlink(tempClipPath).catch(() => {});

        // Extract frame and generate thumbnail
        const midpoint = candidate.duration / 2;
        await extractFrame(clipPath, framePath, midpoint);

        // Generate caption
        const caption = await generateCaption(candidate.transcript);

        // Generate thumbnail with text
        await generateThumbnail(framePath, thumbnailPath, caption.title);

        // Clean up frame
        await fs.unlink(framePath).catch(() => {});

        // Insert clip record
        const clipResult = await db.query(
          `INSERT INTO clips (
            episode_id, start_time, end_time, duration, score, transcript,
            file_path, thumbnail_path, title, caption, hashtags, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id`,
          [
            episodeId,
            candidate.start,
            candidate.end,
            candidate.duration,
            candidate.score,
            candidate.transcript,
            clipPath,
            thumbnailPath,
            caption.title,
            caption.caption,
            caption.hashtags,
            'ready'
          ]
        );

        clipIds.push(clipResult.rows[0].id);

        await db.logActivity('clip_processed', {
          episodeId,
          clipId: clipResult.rows[0].id,
          clipNumber: i + 1
        }, 'success');

      } catch (error: any) {
        const errorMsg = `Clip ${i + 1} failed: ${error.message}`;
        errors.push(errorMsg);
        await db.logActivity('clip_processing_error', {
          episodeId,
          clipNumber: i + 1,
          error: error.message
        }, 'error');
      }
    }

    // Update episode status
    await db.query(
      `UPDATE episodes SET status = $1, processed_at = NOW() WHERE id = $2`,
      ['completed', episodeId]
    );

    await db.logActivity('process_episode_complete', {
      episodeId,
      clipsGenerated: clipIds.length,
      errors: errors.length
    }, errors.length > 0 ? 'error' : 'success');

    return {
      episodeId,
      clipsGenerated: clipIds.length,
      clipIds,
      errors
    };

  } catch (error: any) {
    await db.logActivity('process_episode_error', {
      filename,
      error: error.message
    }, 'error', error.message);

    throw error;
  }
}

export async function scheduleClipsForUpload(
  clipIds: number[],
  scheduleTimes: Date[]
): Promise<void> {
  // Take top 2 clips (or as many as schedule times provided)
  const clipsToSchedule = clipIds.slice(0, Math.min(clipIds.length, scheduleTimes.length));

  for (let i = 0; i < clipsToSchedule.length; i++) {
    await db.query(
      `INSERT INTO uploads (clip_id, platform, scheduled_time, status)
       VALUES ($1, $2, $3, $4)`,
      [clipsToSchedule[i], 'youtube', scheduleTimes[i], 'scheduled']
    );
  }

  await db.logActivity('clips_scheduled', {
    clipIds: clipsToSchedule,
    scheduleTimes: scheduleTimes.map(t => t.toISOString())
  }, 'success');
}

export async function getNextScheduledUpload(): Promise<any> {
  const result = await db.query(
    `SELECT u.*, c.file_path, c.thumbnail_path, c.title, c.caption, c.hashtags, c.transcript
     FROM uploads u
     JOIN clips c ON u.clip_id = c.id
     WHERE u.status = 'scheduled' AND u.scheduled_time <= NOW()
     ORDER BY u.scheduled_time ASC
     LIMIT 1`
  );

  return result.rows[0];
}
