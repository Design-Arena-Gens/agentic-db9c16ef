'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Loader2, ExternalLink } from 'lucide-react';

interface ScheduledUpload {
  id: number;
  clip_id: number;
  title: string;
  platform: string;
  scheduled_time: string;
  status: string;
  url?: string;
  uploaded_at?: string;
}

export default function ScheduleView() {
  const [uploads, setUploads] = useState<ScheduledUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(fetchSchedule, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/schedule');
      const data = await res.json();
      setUploads(data);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const scheduled = uploads.filter(u => u.status === 'scheduled');
  const uploaded = uploads.filter(u => u.status === 'uploaded');

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Upload Schedule</h2>

      {/* Scheduled Uploads */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Scheduled ({scheduled.length})
        </h3>

        {scheduled.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-white/5 rounded-lg">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No uploads scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduled.map((upload) => (
              <div
                key={upload.id}
                className="bg-white/10 rounded-lg p-4 border border-blue-400/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium mb-1">{upload.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(upload.scheduled_time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(upload.scheduled_time).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm font-medium">
                    {upload.platform}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Uploads */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Recent Uploads ({uploaded.length})
        </h3>

        {uploaded.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-white/5 rounded-lg">
            <p>No recent uploads</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploaded.slice(0, 10).map((upload) => (
              <div
                key={upload.id}
                className="bg-white/10 rounded-lg p-4 border border-green-400/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium mb-1">{upload.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Uploaded
                      </div>
                      {upload.uploaded_at && (
                        <div>
                          {new Date(upload.uploaded_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {upload.url && (
                      <a
                        href={upload.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
                      >
                        View on YouTube
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm font-medium">
                    {upload.platform}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
