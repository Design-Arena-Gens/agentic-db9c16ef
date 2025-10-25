# 🎙️ Podcast Clip Automation System

A complete, production-ready automation system that converts long-form podcast episodes into viral short-form video clips for YouTube Shorts, TikTok, and Instagram Reels.

## 🚀 Features

### 🤖 Fully Automated Pipeline
- **Auto-detection** of new podcast episodes
- **AI-powered clip detection** using GPT-4 and engagement scoring
- **Automatic transcription** with OpenAI Whisper
- **Smart subtitle generation** with hardcoded white text
- **AI caption & hashtag generation** optimized for virality
- **Scheduled uploads** to YouTube (2 clips/day)
- **Auto-comment posting** for engagement boost

### 📊 Web Dashboard
- Real-time processing status
- Clip library with engagement scores
- Upload scheduler
- Activity monitoring
- Settings management

### 🎬 Video Processing
- Automatic clip extraction (15-60 seconds)
- Hardcoded subtitles (white text, black outline)
- Audio/video fade transitions
- Thumbnail generation with text overlay
- Platform-specific formatting (9:16 vertical)

### 📈 Engagement Optimization
- Viral keyword detection
- Engagement phrase scoring
- Question/exclamation weighting
- GPT-4 content validation
- Automated pinned comments

## 📦 Installation

```bash
# Clone repository
git clone <your-repo>
cd podcast-clip-automation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize database
createdb podcast_clips

# Start development server
npm run dev

# Start background worker (in separate terminal)
npm run worker
```

## 🔑 Required API Keys

### OpenAI API
- Used for Whisper transcription and GPT-4 caption generation
- Get key: https://platform.openai.com/api-keys

### YouTube Data API v3
1. Create project in Google Cloud Console
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Set redirect URI: `http://localhost:3000/api/auth/youtube/callback`
5. Visit `/api/auth/youtube` to authorize and get refresh token

### PostgreSQL Database
```bash
# Local setup
createdb podcast_clips

# Or use hosted (Vercel Postgres, Supabase, etc.)
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# OpenAI (required)
OPENAI_API_KEY=sk-...

# YouTube (required for uploads)
YOUTUBE_CLIENT_ID=...apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback
YOUTUBE_REFRESH_TOKEN=...

# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/podcast_clips

# Storage paths
UPLOAD_DIR=/tmp/uploads
OUTPUT_DIR=/tmp/outputs

# Schedule (24-hour format)
SCHEDULE_TIME_1=13:00
SCHEDULE_TIME_2=21:00
TIMEZONE=America/New_York
```

## 🎯 Usage

### 1. Upload Episode
1. Go to **Upload** tab
2. Select podcast audio/video file (MP3/MP4)
3. Click **Process Episode**
4. Wait for AI processing (2-10 minutes depending on length)

### 2. Review Clips
1. Go to **Clips** tab
2. Review AI-generated clips with engagement scores
3. Each clip includes:
   - AI-generated title
   - Viral caption
   - Hashtags
   - Duration & score
   - Subtitles (hardcoded)
   - Thumbnail

### 3. Schedule Uploads
- Top 2 clips are auto-scheduled after processing
- Or manually schedule any clip by clicking **Schedule**
- Default times: 1:00 PM and 9:00 PM daily

### 4. Monitor Activity
- **Schedule** tab shows upcoming and completed uploads
- **Activity Log** tracks all system actions
- **Dashboard** provides overview

## 🧠 How It Works

### Clip Detection Algorithm

Scores clips based on:
- **Viral keywords** (what if, never, actually, crazy, shocking)
- **Engagement phrases** (let me tell you, you won't believe)
- **Questions** (curiosity factor)
- **Exclamations** (energy level)
- **Proper nouns** (specificity)
- **Pacing** (words per second)
- **GPT-4 validation**

### Subtitle Styling
- Font: Arial Bold, 24px
- Color: White (#FFFFFF)
- Outline: Black, 2px
- Position: Bottom-center (safe zone)
- Max 2 lines per caption

### Upload Strategy
- 2 uploads per day (configurable)
- Scheduled at consistent times
- Automatic pinned engagement comment
- Platform: YouTube Shorts
- Privacy: Public
- Category: People & Blogs (22)

## 🔧 System Architecture

```
┌─────────────────┐
│  Web Dashboard  │ (Next.js)
└────────┬────────┘
         │
    ┌────┴────┐
    │   API   │
    └────┬────┘
         │
    ┌────┴──────────────────────────┐
    │                                │
┌───┴────┐                    ┌─────┴──────┐
│Pipeline│                    │   Worker   │
└───┬────┘                    └─────┬──────┘
    │                               │
    │  1. Transcribe (Whisper)     │ Cron (every minute)
    │  2. Detect clips (AI)         │ Check scheduled uploads
    │  3. Extract video (FFmpeg)    │ Upload to YouTube
    │  4. Add subtitles             │ Post comment
    │  5. Generate caption (GPT-4)  │
    │  6. Create thumbnail          │
    │  7. Save to DB                │
    │                                │
    └────────────┬───────────────────┘
                 │
          ┌──────┴──────┐
          │  PostgreSQL │
          └─────────────┘
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-db9c16ef

# Set environment variables in Vercel dashboard
vercel env add OPENAI_API_KEY
vercel env add YOUTUBE_CLIENT_ID
# ... etc
```

### Database Setup
Use Vercel Postgres or external provider:
```bash
vercel postgres create
```

### Worker Process
For background worker, use:
- **Vercel Cron** (for serverless)
- **Railway** / **Render** (for always-on worker)
- **Docker** container

## 📊 Database Schema

```sql
-- Episodes
episodes (id, filename, file_path, duration, status, created_at, processed_at)

-- Clips
clips (id, episode_id, start_time, end_time, duration, score, transcript, 
       file_path, thumbnail_path, title, caption, hashtags, status, created_at)

-- Uploads
uploads (id, clip_id, platform, video_id, url, scheduled_time, 
         uploaded_at, status, error_message, comment_posted, created_at)

-- Activity Log
activity_log (id, action, details, status, error_message, created_at)
```

## 🔐 Security

- API keys stored in environment variables
- OAuth 2.0 for YouTube authentication
- Refresh tokens securely managed
- SQL injection prevention (parameterized queries)
- File upload validation
- Rate limiting on YouTube API

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Node.js, TypeScript
- **Database**: PostgreSQL
- **Video**: FFmpeg, fluent-ffmpeg
- **AI**: OpenAI (Whisper, GPT-4)
- **YouTube**: Google APIs (googleapis)
- **Scheduler**: node-cron
- **Image**: Sharp

## 📈 Roadmap

- [ ] TikTok integration
- [ ] Instagram Reels integration
- [ ] Multiple podcast channel support
- [ ] A/B testing for captions
- [ ] Analytics dashboard
- [ ] Webhook notifications
- [ ] Batch processing
- [ ] Cloud storage integration (S3/GCS)

## 🐛 Troubleshooting

### FFmpeg not found
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Docker
FROM node:20
RUN apt-get update && apt-get install -y ffmpeg
```

### Database connection error
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run database initialization

### YouTube upload fails
- Check OAuth tokens are valid
- Verify API quota (10,000 units/day)
- Ensure video meets platform requirements

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues and questions:
- GitHub Issues: [your-repo]/issues
- Email: support@example.com

---

Built with ❤️ for content creators
