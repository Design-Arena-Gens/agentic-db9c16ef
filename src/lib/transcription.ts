import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
});

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
}

export async function transcribeAudio(audioPath: string): Promise<TranscriptSegment[]> {
  try {
    const audioFile = fs.createReadStream(audioPath);

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word', 'segment'],
    });

    // Transform to our format
    const segments: TranscriptSegment[] = [];

    if (response.words) {
      // Group words into segments (sentences or natural pauses)
      let currentSegment: TranscriptSegment = {
        text: '',
        start: 0,
        end: 0,
        words: []
      };

      for (let i = 0; i < response.words.length; i++) {
        const word = response.words[i];

        if (currentSegment.words.length === 0) {
          currentSegment.start = word.start;
        }

        currentSegment.words.push({
          word: word.word,
          start: word.start,
          end: word.end,
        });

        currentSegment.text += word.word;
        currentSegment.end = word.end;

        // Break segment on punctuation or every ~10 seconds
        const nextWord = response.words[i + 1];
        const shouldBreak =
          word.word.match(/[.!?]$/) ||
          (nextWord && (nextWord.start - word.end > 1.0)) ||
          (currentSegment.end - currentSegment.start > 10);

        if (shouldBreak || i === response.words.length - 1) {
          segments.push({ ...currentSegment });
          currentSegment = {
            text: '',
            start: 0,
            end: 0,
            words: []
          };
        } else {
          currentSegment.text += ' ';
        }
      }
    }

    return segments;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export function cleanTranscript(segments: TranscriptSegment[]): TranscriptSegment[] {
  return segments.map(seg => ({
    ...seg,
    text: seg.text
      .replace(/\s+/g, ' ')
      .replace(/\s([.,!?])/g, '$1')
      .trim()
  }));
}
