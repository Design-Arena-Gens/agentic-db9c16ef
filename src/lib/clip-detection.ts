import { TranscriptSegment } from './transcription';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
});

export interface ClipCandidate {
  start: number;
  end: number;
  duration: number;
  score: number;
  transcript: string;
  reason: string;
}

const VIRAL_KEYWORDS = [
  'what if', 'never', 'wait', 'actually', 'literally', 'crazy', 'insane',
  'unbelievable', 'shocking', 'secret', 'truth', 'nobody', 'everyone',
  'always', 'finally', 'revealed', 'exposed', 'mind-blowing', 'game-changer'
];

const ENGAGEMENT_PHRASES = [
  'let me tell you', 'here\'s the thing', 'you won\'t believe',
  'i\'m telling you', 'listen to this', 'check this out', 'get this'
];

export async function detectClips(
  segments: TranscriptSegment[],
  maxDuration: number = 60,
  topN: number = 10
): Promise<ClipCandidate[]> {
  const candidates: ClipCandidate[] = [];

  // Sliding window to find engaging segments
  for (let i = 0; i < segments.length; i++) {
    let windowStart = i;
    let windowEnd = i;
    let duration = 0;
    let text = '';

    // Expand window up to maxDuration
    while (windowEnd < segments.length) {
      const segment = segments[windowEnd];
      const newDuration = segment.end - segments[windowStart].start;

      if (newDuration > maxDuration) break;

      duration = newDuration;
      text += segment.text + ' ';
      windowEnd++;

      // Only consider windows of at least 15 seconds
      if (duration >= 15 && duration <= maxDuration) {
        const score = calculateEngagementScore(text, segments.slice(windowStart, windowEnd));

        if (score > 0.3) { // Threshold filter
          candidates.push({
            start: segments[windowStart].start,
            end: segments[windowEnd - 1].end,
            duration,
            score,
            transcript: text.trim(),
            reason: getScoreReason(text, score)
          });
        }
      }
    }
  }

  // Remove overlapping clips, keep highest scored
  const filtered = removeOverlaps(candidates);

  // Sort by score and take top N
  return filtered
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

function calculateEngagementScore(text: string, segments: TranscriptSegment[]): number {
  let score = 0;
  const lowerText = text.toLowerCase();

  // Keyword matching (0-0.3 points)
  const keywordMatches = VIRAL_KEYWORDS.filter(kw => lowerText.includes(kw)).length;
  score += Math.min(keywordMatches * 0.05, 0.3);

  // Engagement phrases (0-0.2 points)
  const engagementMatches = ENGAGEMENT_PHRASES.filter(phrase => lowerText.includes(phrase)).length;
  score += Math.min(engagementMatches * 0.1, 0.2);

  // Question marks (curiosity) (0-0.15 points)
  const questions = (text.match(/\?/g) || []).length;
  score += Math.min(questions * 0.05, 0.15);

  // Exclamation marks (energy) (0-0.15 points)
  const exclamations = (text.match(/!/g) || []).length;
  score += Math.min(exclamations * 0.05, 0.15);

  // Proper nouns (specificity) (0-0.1 points)
  const properNouns = (text.match(/\b[A-Z][a-z]+\b/g) || []).length;
  score += Math.min(properNouns * 0.02, 0.1);

  // Word count density (prefer concise)
  const wordCount = text.split(/\s+/).length;
  const duration = segments[segments.length - 1].end - segments[0].start;
  const wordsPerSecond = wordCount / duration;
  if (wordsPerSecond >= 2.5 && wordsPerSecond <= 4) {
    score += 0.1; // Good pacing
  }

  return Math.min(score, 1);
}

function getScoreReason(text: string, score: number): string {
  const reasons: string[] = [];

  if (text.toLowerCase().split(' ').some(word => VIRAL_KEYWORDS.includes(word))) {
    reasons.push('viral keywords');
  }
  if (text.includes('?')) {
    reasons.push('engaging question');
  }
  if (text.includes('!')) {
    reasons.push('high energy');
  }
  if (/\b[A-Z][a-z]+\b/.test(text)) {
    reasons.push('specific examples');
  }

  return reasons.length > 0 ? reasons.join(', ') : 'good pacing';
}

function removeOverlaps(candidates: ClipCandidate[]): ClipCandidate[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const result: ClipCandidate[] = [];

  for (const candidate of sorted) {
    const hasOverlap = result.some(existing => {
      return !(candidate.end <= existing.start || candidate.start >= existing.end);
    });

    if (!hasOverlap) {
      result.push(candidate);
    }
  }

  return result;
}

export async function refineClipWithAI(candidate: ClipCandidate): Promise<ClipCandidate> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert video clip curator. Evaluate if this transcript segment would make an engaging short-form video clip for YouTube Shorts/TikTok. Respond with a score from 0-1 and a brief reason.'
        },
        {
          role: 'user',
          content: `Transcript: "${candidate.transcript}"\n\nCurrent score: ${candidate.score}\n\nIs this engaging for short-form video? Give a score 0-1 and reason.`
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const aiResponse = response.choices[0].message.content || '';
    const scoreMatch = aiResponse.match(/(\d+\.?\d*)/);

    if (scoreMatch) {
      const aiScore = parseFloat(scoreMatch[1]);
      candidate.score = (candidate.score + aiScore) / 2; // Average with original
    }

    return candidate;
  } catch (error) {
    console.error('AI refinement error:', error);
    return candidate;
  }
}
