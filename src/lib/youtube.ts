import { google, youtube_v3 } from 'googleapis';
import fs from 'fs';
import { getRandomCommentTemplate } from './caption-generator';

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

if (process.env.YOUTUBE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
  });
}

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
});

export interface UploadOptions {
  title: string;
  description: string;
  tags: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
  scheduledTime?: Date;
  thumbnailPath?: string;
}

export async function uploadVideo(
  videoPath: string,
  options: UploadOptions
): Promise<string> {
  try {
    const requestBody: youtube_v3.Schema$Video = {
      snippet: {
        title: options.title,
        description: options.description,
        tags: options.tags,
        categoryId: options.categoryId || '22', // People & Blogs
      },
      status: {
        privacyStatus: options.privacyStatus || 'public',
        publishAt: options.scheduledTime?.toISOString(),
        selfDeclaredMadeForKids: false,
      },
    };

    const media = {
      body: fs.createReadStream(videoPath),
    };

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody,
      media,
    });

    const videoId = response.data.id;

    if (!videoId) {
      throw new Error('No video ID returned from YouTube');
    }

    // Upload thumbnail if provided
    if (options.thumbnailPath) {
      await uploadThumbnail(videoId, options.thumbnailPath);
    }

    return videoId;
  } catch (error: any) {
    console.error('YouTube upload error:', error.message);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
}

export async function uploadThumbnail(
  videoId: string,
  thumbnailPath: string
): Promise<void> {
  try {
    await youtube.thumbnails.set({
      videoId,
      media: {
        body: fs.createReadStream(thumbnailPath),
      },
    });
  } catch (error: any) {
    console.error('Thumbnail upload error:', error.message);
    // Don't throw - thumbnail upload is non-critical
  }
}

export async function postComment(videoId: string, commentText?: string): Promise<string> {
  try {
    const text = commentText || getRandomCommentTemplate();

    const response = await youtube.commentThreads.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text,
            },
          },
        },
      },
    });

    return response.data.id || '';
  } catch (error: any) {
    console.error('Comment post error:', error.message);
    throw new Error(`Failed to post comment: ${error.message}`);
  }
}

export async function getVideoUrl(videoId: string): Promise<string> {
  return `https://www.youtube.com/shorts/${videoId}`;
}

export async function checkQuota(): Promise<{ used: number; limit: number }> {
  // YouTube API quota is 10,000 units per day
  // Video upload = 1600 units
  // Comment = 50 units
  // Typical daily usage for 2 uploads + 2 comments = 3300 units

  return {
    used: 0, // Would need to track this in database
    limit: 10000
  };
}

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ],
    prompt: 'consent'
  });
}

export async function getTokenFromCode(code: string): Promise<any> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

export async function refreshAccessToken(): Promise<void> {
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}
