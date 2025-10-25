import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
});

export interface CaptionResult {
  title: string;
  caption: string;
  hashtags: string[];
  description: string;
}

const CAPTION_PROMPT = `You are a viral short-form video content expert specializing in YouTube Shorts, TikTok, and Instagram Reels.

Given the following video clip transcript, create engaging content that maximizes views and engagement:

TRANSCRIPT:
{transcript}

Generate:
1. A punchy, attention-grabbing TITLE (5-10 words max, capitalize key words)
2. A short CAPTION (8-14 words) that creates curiosity or emotion
3. 8-12 relevant HASHTAGS (mix of broad and niche, trending style)
4. A full DESCRIPTION (2-3 sentences) expanding on the clip

Format your response as JSON:
{
  "title": "...",
  "caption": "...",
  "hashtags": ["tag1", "tag2", ...],
  "description": "..."
}

Make it viral, concise, and platform-optimized for short-form video.`;

const COMMENT_TEMPLATES = [
  "🔥 What would you have said here? Drop it below 👇",
  "😂 Who else relates? Tell us your story!",
  "💭 Agree or disagree — explain in one sentence.",
  "🤔 What's your take on this? Comment below!",
  "👀 Would you do the same? Let me know!",
  "💬 Drop your thoughts — I read every comment!",
  "🎯 Tag someone who needs to hear this!",
  "⚡ Your turn — what would YOU do?",
  "🚀 Let's discuss in the comments!",
  "💡 Share your perspective below!"
];

export async function generateCaption(transcript: string): Promise<CaptionResult> {
  try {
    const prompt = CAPTION_PROMPT.replace('{transcript}', transcript);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a viral content expert.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);

    return {
      title: result.title || 'Untitled Clip',
      caption: result.caption || transcript.slice(0, 100),
      hashtags: result.hashtags || ['#shorts', '#viral', '#trending'],
      description: result.description || transcript
    };
  } catch (error) {
    console.error('Caption generation error:', error);

    // Fallback caption
    return {
      title: transcript.split(' ').slice(0, 8).join(' '),
      caption: transcript.split(' ').slice(0, 12).join(' '),
      hashtags: ['#shorts', '#viral', '#trending', '#podcast', '#clips'],
      description: transcript
    };
  }
}

export function getRandomCommentTemplate(): string {
  return COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)];
}

export function formatYouTubeDescription(
  caption: CaptionResult,
  videoUrl?: string,
  timestamp?: { start: number; end: number }
): string {
  let description = caption.description + '\n\n';

  description += caption.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');

  if (videoUrl && timestamp) {
    description += '\n\n---\n';
    description += `Full episode: ${videoUrl}\n`;
    description += `Timestamp: ${formatTimestamp(timestamp.start)} - ${formatTimestamp(timestamp.end)}`;
  }

  description += '\n\n---\n';
  description += '🎙️ Subscribe for more clips!\n';
  description += '🔔 Turn on notifications to never miss a post!';

  return description;
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
