'use client';

import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface LogEntry {
  id: number;
  action: string;
  details: any;
  status: string;
  error_message?: string;
  created_at: string;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Activity Log</h2>
        <button
          onClick={fetchLogs}
          className="text-sm text-slate-300 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`bg-white/10 rounded-lg p-4 border ${
                log.status === 'success'
                  ? 'border-green-400/30'
                  : log.status === 'error'
                  ? 'border-red-400/30'
                  : 'border-blue-400/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {log.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                  {log.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  {log.status === 'pending' && (
                    <Clock className="w-5 h-5 text-blue-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-medium mb-1">
                        {formatAction(log.action)}
                      </div>
                      {log.details && (
                        <div className="text-sm text-slate-300">
                          {formatDetails(log.details)}
                        </div>
                      )}
                      {log.error_message && (
                        <div className="text-sm text-red-300 mt-1">
                          Error: {log.error_message}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDetails(details: any): string {
  if (typeof details === 'string') return details;

  const parts: string[] = [];

  if (details.filename) parts.push(`File: ${details.filename}`);
  if (details.clipId) parts.push(`Clip #${details.clipId}`);
  if (details.episodeId) parts.push(`Episode #${details.episodeId}`);
  if (details.videoId) parts.push(`Video ID: ${details.videoId}`);
  if (details.clipsGenerated !== undefined)
    parts.push(`${details.clipsGenerated} clips generated`);

  return parts.join(' • ') || JSON.stringify(details).slice(0, 100);
}
