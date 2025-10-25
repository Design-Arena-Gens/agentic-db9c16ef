'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Video, Calendar, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingUploads, setUpcomingUploads] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [activityRes, scheduleRes] = await Promise.all([
        fetch('/api/activity?limit=5'),
        fetch('/api/schedule?upcoming=true&limit=3'),
      ]);

      const activity = await activityRes.json();
      const schedule = await scheduleRes.json();

      setRecentActivity(activity);
      setUpcomingUploads(schedule);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Uploads */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Upcoming Uploads</h3>
          </div>

          {upcomingUploads.length === 0 ? (
            <p className="text-slate-400 text-sm">No uploads scheduled</p>
          ) : (
            <div className="space-y-3">
              {upcomingUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="bg-white/5 rounded p-3 border border-white/10"
                >
                  <div className="text-white font-medium text-sm mb-1">
                    {upload.title}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {new Date(upload.scheduled_time).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-slate-400 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 bg-white/5 rounded p-3 border border-white/10"
                >
                  {log.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {log.action.split('_').join(' ')}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-blue-400/30">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Start Guide</h3>
        <ol className="space-y-3 text-slate-300">
          <li className="flex items-start gap-3">
            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </span>
            <div>
              <div className="font-medium text-white">Upload an Episode</div>
              <div className="text-sm text-slate-400">
                Go to Upload tab and select your podcast audio or video file
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </span>
            <div>
              <div className="font-medium text-white">Review Generated Clips</div>
              <div className="text-sm text-slate-400">
                Check the Clips tab to see AI-generated short clips with scores
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </span>
            <div>
              <div className="font-medium text-white">Schedule Uploads</div>
              <div className="text-sm text-slate-400">
                Schedule your best clips for automatic posting to YouTube
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              4
            </span>
            <div>
              <div className="font-medium text-white">Monitor Activity</div>
              <div className="text-sm text-slate-400">
                Track uploads and engagement in the Activity Log
              </div>
            </div>
          </li>
        </ol>
      </div>

      {/* System Status */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusItem
            label="API Keys"
            status={process.env.OPENAI_API_KEY ? 'active' : 'missing'}
          />
          <StatusItem
            label="YouTube Auth"
            status={process.env.YOUTUBE_REFRESH_TOKEN ? 'active' : 'missing'}
          />
          <StatusItem
            label="Database"
            status={process.env.DATABASE_URL ? 'active' : 'missing'}
          />
          <StatusItem label="Worker" status="active" />
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="bg-white/5 rounded p-3 text-center">
      <div className="text-slate-400 text-xs mb-1">{label}</div>
      <div
        className={`text-sm font-medium ${
          status === 'active' ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {status === 'active' ? '✓ Active' : '✗ Missing'}
      </div>
    </div>
  );
}
