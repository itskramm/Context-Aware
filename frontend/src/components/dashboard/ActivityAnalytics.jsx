import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Library, Sparkles } from 'lucide-react';

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
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Activity</h3>
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 mb-10">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Activity</h3>
        <div className="text-center py-8 text-sm text-muted-foreground">
          {error ? `Unable to load activity data: ${error}` : 'No activity data available yet.'}
        </div>
      </div>
    );
  }

  const daily = analytics.dailyActivity || [];
  const todayData = daily[daily.length - 1] || { lectures: 0, digests: 0 };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 mb-10">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">Activity</h3>
      <p className="text-xs text-muted-foreground mb-6">Your activity for today.</p>

      {/* Today's stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-background/50 border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Library className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Lectures today</p>
          </div>
          <p className="text-3xl font-bold">{todayData.lectures}</p>
        </div>
        <div className="rounded-xl bg-background/50 border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Digests today</p>
          </div>
          <p className="text-3xl font-bold">{todayData.digests}</p>
        </div>
      </div>
    </div>
  );
}
