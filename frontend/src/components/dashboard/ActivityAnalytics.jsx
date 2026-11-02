import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { BarChart3, Clock, CheckCircle2, Loader2, Library, Sparkles, TrendingUp, Timer } from 'lucide-react';

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

function MiniBar({ label, lectures, digests, maxVal }) {
  const total = lectures + digests;
  const barW = maxVal > 0 ? Math.round((total / maxVal) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-8 shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
        <div className="h-full flex gap-px">
          <div className="bg-primary/70 rounded-l-full transition-all duration-300" style={{ width: `${maxVal > 0 ? (lectures / maxVal) * 100 : 0}%` }} />
          <div className="bg-primary/30 rounded-r-full transition-all duration-300" style={{ width: `${maxVal > 0 ? (digests / maxVal) * 100 : 0}%` }} />
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground w-4 text-right">{total || ''}</span>
    </div>
  );
}

export default function ActivityAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

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
        <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Analytics</h3>
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (error || !analytics) {
    return null; // Silently hide if analytics fails
  }

  const daily = analytics.dailyActivity || [];
  const maxDailyVal = daily.reduce((m, d) => Math.max(m, d.lectures + d.digests), 1);

  // Savings percentage
  const savingsPct = analytics.totalLectureSeconds > 0
    ? Math.round((analytics.totalTimeSavedSeconds / analytics.totalLectureSeconds) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 mb-10">
      <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Analytics
      </h3>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={Library}
          label="Total lecture time"
          value={fmtTime(analytics.totalLectureSeconds)}
          sub={`${analytics.totalLectures} lecture${analytics.totalLectures !== 1 ? 's' : ''}`}
        />
        <MetricCard
          icon={Sparkles}
          label="Total digest time"
          value={fmtTime(analytics.totalDigestSeconds)}
          sub={`${analytics.totalDigests} digest${analytics.totalDigests !== 1 ? 's' : ''}`}
        />
        <MetricCard
          icon={Timer}
          label="Time saved"
          value={fmtTime(analytics.totalTimeSavedSeconds)}
          sub={savingsPct > 0 ? `${savingsPct}% less time studying` : 'Start digesting to save time'}
          highlight={analytics.totalTimeSavedSeconds > 0}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completion rate"
          value={`${analytics.completionRate}%`}
          sub="Lectures fully processed"
        />
      </div>

      {/* 7-day activity chart */}
      {daily.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Last 7 days
            <span className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/70 inline-block" /> Lectures</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/30 inline-block" /> Digests</span>
            </span>
          </p>
          <div className="space-y-1.5">
            {daily.map((d) => (
              <MiniBar key={d.date} label={d.label} lectures={d.lectures} digests={d.digests} maxVal={maxDailyVal} />
            ))}
          </div>
          {analytics.thisWeek > 0 && (
            <p className="text-xs text-primary mt-3 font-medium">{analytics.weekTrend}</p>
          )}
        </div>
      )}
    </div>
  );
}
