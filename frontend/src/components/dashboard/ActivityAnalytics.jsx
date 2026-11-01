import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, Clock, CheckCircle2, Loader2 } from 'lucide-react';

export default function ActivityAnalytics() {
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
      const data = await base44.analytics.dashboard();
      setAnalytics(data);
    } catch (err) {
      // Silently fail if analytics endpoint doesn't exist yet
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 mb-10">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Activity Analytics
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // If analytics endpoint doesn't exist yet, show placeholder
  if (error || !analytics) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 mb-10">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Activity Analytics
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            icon={TrendingUp} 
            label="This Week" 
            value="—" 
            trend="Analytics coming soon"
          />
          <MetricCard 
            icon={Clock} 
            label="Avg. Time Saved" 
            value="—" 
            trend="Per digest"
          />
          <MetricCard 
            icon={CheckCircle2} 
            label="Completion Rate" 
            value="—" 
            trend="Overall"
          />
          <MetricCard 
            icon={BarChart3} 
            label="Total Sessions" 
            value="—" 
            trend="All time"
          />
        </div>
      </div>
    );
  }

  // Display real analytics data
  return (
    <div className="rounded-2xl border border-border bg-card p-6 mb-10">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Activity Analytics
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          icon={TrendingUp} 
          label="This Week" 
          value={analytics.thisWeek || 0} 
          trend={analytics.weekTrend || "No change"}
        />
        <MetricCard 
          icon={Clock} 
          label="Avg. Time Saved" 
          value={formatTime(analytics.avgTimeSaved || 0)} 
          trend="Per digest"
        />
        <MetricCard 
          icon={CheckCircle2} 
          label="Completion Rate" 
          value={`${analytics.completionRate || 0}%`} 
          trend="Overall"
        />
        <MetricCard 
          icon={BarChart3} 
          label="Total Sessions" 
          value={analytics.totalSessions || 0} 
          trend="All time"
        />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-background/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {trend && (
        <p className="text-xs text-muted-foreground mt-1 opacity-70">{trend}</p>
      )}
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}