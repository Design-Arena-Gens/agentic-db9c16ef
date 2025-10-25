import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),

  async initialize() {
    await this.query(`
      CREATE TABLE IF NOT EXISTS episodes (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        duration REAL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP
      )
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS clips (
        id SERIAL PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        start_time REAL NOT NULL,
        end_time REAL NOT NULL,
        duration REAL NOT NULL,
        score REAL,
        transcript TEXT,
        file_path TEXT,
        thumbnail_path TEXT,
        title TEXT,
        caption TEXT,
        hashtags TEXT[],
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        clip_id INTEGER REFERENCES clips(id) ON DELETE CASCADE,
        platform TEXT NOT NULL,
        video_id TEXT,
        url TEXT,
        scheduled_time TIMESTAMP,
        uploaded_at TIMESTAMP,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        comment_posted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        details JSONB,
        status TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
      CREATE INDEX IF NOT EXISTS idx_clips_status ON clips(status);
      CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
      CREATE INDEX IF NOT EXISTS idx_uploads_scheduled ON uploads(scheduled_time);
    `);
  },

  async logActivity(action: string, details: any, status: 'success' | 'error' | 'pending' = 'success', errorMessage?: string) {
    return this.query(
      `INSERT INTO activity_log (action, details, status, error_message) VALUES ($1, $2, $3, $4)`,
      [action, JSON.stringify(details), status, errorMessage]
    );
  }
};
