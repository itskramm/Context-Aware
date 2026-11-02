import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { BarChart3, Clock, CheckCircle2, Loader2, Library, Sparkles, Timer } from 'lucide-react';

function fmtTime(seconds) {
  if (!seconds || seconds < 60) return `${Math.round(seconds || 0)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function MetricCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-background/50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

export default function ActivityAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('daily'); // daily, weekly, monthly

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await base44.get('/analytics/dashboard', user?.id ? { userId: user.id } : {});
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 mb-10">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Activity</h3>
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (error || !analytics) {
    // Fallback: show empty activity instead of hiding section
    return (
      <div className="rounded-2xl border border-border bg-card p-6 mb-10">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Activity</h3>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button className="px-3 py-1 text-xs font-medium rounded bg-primary text-primary-foreground">Daily</button>
            <button className="px-3 py-1 text-xs font-medium rounded text-muted-foreground">Weekly</button>
            <button className="px-3 py-1 text-xs font-medium rounded text-muted-foreground">Monthly</button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Lectures added and digests generated over time.</p>
        <div className="text-center py-8 text-sm text-muted-foreground">
          {error ? `Unable to load activity data: ${error}` : 'No activity data available yet.'}
        </div>
      </div>
    );
  }

  const daily = analytics.dailyActivity || [];
  const todayData = daily[daily.length - 1] || { lectures: 0, digests: 0 };
  const savedToday = analytics.totalTimeSavedSeconds > 0 
    ? fmtTime(Math.round(analytics.totalTimeSavedSeconds / Math.max(analytics.totalDigests, 1)))
    : '0m';

  // Chart data based on period
  const chartData = daily;
  const maxVal = chartData.reduce((m, d) => Math.max(m, d.lectures + d.digests), 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 mb-10">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Activity</h3>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              period === 'daily' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              period === 'weekly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              period === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-6">Lectures added and digests generated over time.</p>

      {/* Today's stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-background/50 border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Lectures today</p>
          <p className="text-3xl font-bold">{todayData.lectures}</p>
        </div>
        <div className="rounded-xl bg-background/50 border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Digests today</p>
          <p className="text-3xl font-bold">{todayData.digests}</p>
        </div>
        <div className="rounded-xl bg-background/50 border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Saved today</p>
          <p className="text-3xl font-bold">{savedToday}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 mb-4">
        <div className="absolute inset-0 flex items-end justify-between gap-1.5 pb-6">
          {chartData.map((d, i) => {
            const total = d.lectures + d.digests;
            const lectureH = maxVal > 0 ? (d.lectures / maxVal) * 100 : 0;
            const digestH = maxVal > 0 ? (d.digests / maxVal) * 100 : 0;
            return (
              <div key={d.date} className="flex-1 flex flex-col justify-end h-full">
                <div className="w-full flex flex-col-reverse items-center gap-0.5">
                  {d.lectures > 0 && (
                    <div 
                      className="w-full bg-white dark:bg-white rounded-t" 
                      style={{ height: `${lectureH}%`, minHeight: d.lectures > 0 ? '4px' : '0' }} 
                    />
                  )}
                  {d.digests > 0 && (
                    <div 
                      className="w-full bg-primary rounded-t" 
                      style={{ height: `${digestH}%`, minHeight: d.digests > 0 ? '4px' : '0' }} 
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-muted-foreground">
          {chartData.map((d) => (
            <span key={d.date} className="flex-1 text-center">{d.label}</span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-white dark:bg-white" />
          Lectures
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
          Digests
        </span>
      </div>
    </div>
  );
}
