'use client';

import { useState, useEffect } from 'react';
import { Upload, Video, Calendar, Activity, Settings, Play } from 'lucide-react';
import UploadSection from '@/components/UploadSection';
import ClipsList from '@/components/ClipsList';
import ScheduleView from '@/components/ScheduleView';
import ActivityLog from '@/components/ActivityLog';
import Dashboard from '@/components/Dashboard';

type Tab = 'dashboard' | 'upload' | 'clips' | 'schedule' | 'activity' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState({
    totalEpisodes: 0,
    totalClips: 0,
    scheduledUploads: 0,
    uploadedToday: 0
  });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Play className="w-10 h-10 text-blue-400" />
            Podcast Clip Automation
          </h1>
          <p className="text-slate-300">AI-powered short-form video generation and publishing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-slate-300 text-sm mb-1">Total Episodes</div>
            <div className="text-3xl font-bold text-white">{stats.totalEpisodes}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-slate-300 text-sm mb-1">Clips Generated</div>
            <div className="text-3xl font-bold text-white">{stats.totalClips}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-slate-300 text-sm mb-1">Scheduled</div>
            <div className="text-3xl font-bold text-white">{stats.scheduledUploads}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-slate-300 text-sm mb-1">Uploaded Today</div>
            <div className="text-3xl font-bold text-white">{stats.uploadedToday}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'clips', label: 'Clips', icon: Video },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'activity', label: 'Activity Log', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'upload' && <UploadSection onUploadComplete={fetchStats} />}
          {activeTab === 'clips' && <ClipsList />}
          {activeTab === 'schedule' && <ScheduleView />}
          {activeTab === 'activity' && <ActivityLog />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="text-white space-y-6">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">YouTube OAuth Status</label>
          <div className="bg-white/10 rounded p-4">
            <p className="text-sm text-slate-300">
              {process.env.YOUTUBE_REFRESH_TOKEN ? '✅ Connected' : '❌ Not connected'}
            </p>
            {!process.env.YOUTUBE_REFRESH_TOKEN && (
              <a
                href="/api/auth/youtube"
                className="inline-block mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Connect YouTube
              </a>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Scheduled Upload Times</label>
          <div className="bg-white/10 rounded p-4 space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-sm">Time 1:</span>
              <input
                type="time"
                defaultValue={process.env.SCHEDULE_TIME_1 || '13:00'}
                className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">Time 2:</span>
              <input
                type="time"
                defaultValue={process.env.SCHEDULE_TIME_2 || '21:00'}
                className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">API Keys</label>
          <div className="bg-white/10 rounded p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>OpenAI API</span>
              <span>{process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}</span>
            </div>
            <div className="flex justify-between">
              <span>YouTube Client ID</span>
              <span>{process.env.YOUTUBE_CLIENT_ID ? '✅ Set' : '❌ Missing'}</span>
            </div>
            <div className="flex justify-between">
              <span>Database</span>
              <span>{process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Storage Locations</label>
          <div className="bg-white/10 rounded p-4 space-y-1 text-sm font-mono">
            <div>Upload: {process.env.UPLOAD_DIR || '/tmp/uploads'}</div>
            <div>Output: {process.env.OUTPUT_DIR || '/tmp/outputs'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
