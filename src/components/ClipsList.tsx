'use client';

import { useState, useEffect } from 'react';
import { Video, Clock, Star, Calendar, Loader2 } from 'lucide-react';

interface Clip {
  id: number;
  title: string;
  caption: string;
  duration: number;
  score: number;
  status: string;
  created_at: string;
  hashtags: string[];
}

export default function ClipsList() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClip, setSelectedClip] = useState<number | null>(null);

  useEffect(() => {
    fetchClips();
  }, []);

  const fetchClips = async () => {
    try {
      const res = await fetch('/api/clips');
      const data = await res.json();
      setClips(data);
    } catch (error) {
      console.error('Failed to fetch clips:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleClip = async (clipId: number, scheduledTime: string) => {
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipId, scheduledTime }),
      });
      fetchClips();
    } catch (error) {
      console.error('Failed to schedule clip:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Generated Clips</h2>
        <div className="text-slate-300 text-sm">
          {clips.length} clip{clips.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {clips.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No clips generated yet</p>
          <p className="text-sm mt-2">Upload an episode to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="bg-white/10 rounded-lg p-4 border border-white/20 hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => setSelectedClip(clip.id === selectedClip ? null : clip.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-medium">{clip.title}</h3>
                  </div>

                  <p className="text-slate-300 text-sm mb-3">{clip.caption}</p>

                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor(clip.duration)}s
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {(clip.score * 100).toFixed(0)}%
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      clip.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                      clip.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {clip.status}
                    </div>
                  </div>
                </div>

                {clip.status === 'ready' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const time = prompt('Enter schedule time (YYYY-MM-DD HH:MM):');
                      if (time) scheduleClip(clip.id, time);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </button>
                )}
              </div>

              {selectedClip === clip.id && (
                <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Hashtags</div>
                    <div className="flex flex-wrap gap-2">
                      {clip.hashtags.map((tag, i) => (
                        <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Created</div>
                    <div className="text-sm text-slate-300">
                      {new Date(clip.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
