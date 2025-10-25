import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { TranscriptSegment } from './transcription';

export interface EditOptions {
  fadeInDuration?: number;
  fadeOutDuration?: number;
  addIntro?: boolean;
  addOutro?: boolean;
  introPath?: string;
  outroPath?: string;
}

export async function extractClip(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number,
  options: EditOptions = {}
): Promise<void> {
  const {
    fadeInDuration = 0.3,
    fadeOutDuration = 0.3,
  } = options;

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-ar 44100',
        '-vf', `fade=t=in:st=0:d=${fadeInDuration},fade=t=out:st=${duration - fadeOutDuration}:d=${fadeOutDuration}`,
        '-af', `afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${duration - fadeOutDuration}:d=${fadeOutDuration}`,
      ]);

    command
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

export async function addSubtitles(
  videoPath: string,
  outputPath: string,
  segments: TranscriptSegment[],
  startTime: number,
  endTime: number
): Promise<void> {
  // Filter segments within clip time range
  const clipSegments = segments.filter(
    seg => seg.start >= startTime && seg.end <= endTime
  );

  // Generate SRT file
  const srtPath = videoPath.replace(/\.[^.]+$/, '.srt');
  const srtContent = generateSRT(clipSegments, startTime);
  await fs.writeFile(srtPath, srtContent);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        '-vf',
        `subtitles=${srtPath}:force_style='FontName=Arial Bold,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=45'`,
        '-c:a copy'
      ])
      .on('end', async () => {
        await fs.unlink(srtPath).catch(() => {}); // Clean up SRT
        resolve();
      })
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

function generateSRT(segments: TranscriptSegment[], offsetSeconds: number): string {
  let srtContent = '';

  segments.forEach((seg, index) => {
    const startTime = seg.start - offsetSeconds;
    const endTime = seg.end - offsetSeconds;

    srtContent += `${index + 1}\n`;
    srtContent += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
    srtContent += `${seg.text}\n\n`;
  });

  return srtContent;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms
    .toString()
    .padStart(3, '0')}`;
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
}

export async function extractFrame(
  videoPath: string,
  outputPath: string,
  timestamp: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720'
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

export async function resizeForPlatform(
  videoPath: string,
  outputPath: string,
  platform: 'youtube' | 'tiktok' | 'reels' = 'youtube'
): Promise<void> {
  // All short-form platforms use 9:16 vertical format
  const width = 1080;
  const height = 1920;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a copy'
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}
