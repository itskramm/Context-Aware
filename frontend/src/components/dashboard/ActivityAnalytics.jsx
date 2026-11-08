import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Library, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

  // Aggregate daily data into weeks
  const aggregateWeeks = (dailyData) => {
    if (!dailyData || dailyData.length === 0) return [];
    
    const weeks = [];
    const sortedData = [...dailyData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let currentWeek = null;
    let weekData = { lectures: 0, digests: 0, startDate: null, endDate: null };
    
    sortedData.forEach((day) => {
      const date = new Date(day.date);
      const weekNum = getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-W${weekNum}`;
      
      if (currentWeek !== weekKey) {
        if (currentWeek !== null && weekData.startDate) {
          weeks.push({ ...weekData, weekKey: currentWeek });
        }
        currentWeek = weekKey;
        weekData = { lectures: day.lectures, digests: day.digests, startDate: day.date, endDate: day.date };
      } else {
        weekData.lectures += day.lectures;
        weekData.digests += day.digests;
        weekData.endDate = day.date;
      }
    });
    
    if (currentWeek && weekData.startDate) {
      weeks.push({ ...weekData, weekKey: currentWeek });
    }
    
    return weeks.slice(-8);
  };

  // Aggregate daily data into months
  const aggregateMonths = (dailyData) => {
    if (!dailyData || dailyData.length === 0) return [];
    
    const months = {};
    
    dailyData.forEach((day) => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { lectures: 0, digests: 0, monthKey, date: day.date };
      }
      months[monthKey].lectures += day.lectures;
      months[monthKey].digests += day.digests;
    });
    
    return Object.values(months).sort((a, b) => a.monthKey.localeCompare(b.monthKey)).slice(-6);
  };

  // Get week number for a date
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMonthYear = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Render stats cards
  const renderStatsCards = (totals, labels) => {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-background/50 border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Library className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{labels.lectures}</p>
          </div>
          <p className="text-3xl font-bold">{totals.lectures}</p>
        </div>
        <div className="rounded-xl bg-background/50 border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{labels.digests}</p>
          </div>
          <p className="text-3xl font-bold">{totals.digests}</p>
        </div>
      </div>
    );
  };

  // Render simple bar visualization
  const renderBarChart = (data, formatLabel) => {
    if (!data || data.length === 0) {
      return <div className="text-center py-4 text-sm text-muted-foreground">No data available</div>;
    }

    const maxTotal = Math.max(...data.map(d => d.lectures + d.digests), 1);

    return (
      <div className="space-y-3">
        {data.map((item, idx) => {
          const total = item.lectures + item.digests;
          const lecturesPercent = maxTotal > 0 ? (item.lectures / maxTotal) * 100 : 0;
          const digestsPercent = maxTotal > 0 ? (item.digests / maxTotal) * 100 : 0;

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{formatLabel(item)}</span>
                <span className="font-medium">{total} total</span>
              </div>
              <div className="flex gap-1 h-6 rounded-md overflow-hidden bg-muted">
                {lecturesPercent > 0 && (
                  <div
                    className="bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium"
                    style={{ width: `${lecturesPercent}%` }}
                  >
                    {item.lectures > 0 && <span className="px-1">{item.lectures}</span>}
                  </div>
                )}
                {digestsPercent > 0 && (
                  <div
                    className="bg-primary/60 flex items-center justify-center text-[10px] text-primary-foreground font-medium"
                    style={{ width: `${digestsPercent}%` }}
                  >
                    {item.digests > 0 && <span className="px-1">{item.digests}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
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

  const dailyData = analytics.dailyActivity || [];
  const recentDays = dailyData.slice(-14);
  const weeklyData = aggregateWeeks(dailyData);
  const monthlyData = aggregateMonths(dailyData);

  // Calculate totals for each period
  const dayTotals = recentDays.reduce((acc, d) => ({ 
    lectures: acc.lectures + d.lectures, 
    digests: acc.digests + d.digests 
  }), { lectures: 0, digests: 0 });

  const weekTotals = weeklyData.reduce((acc, w) => ({ 
    lectures: acc.lectures + w.lectures, 
    digests: acc.digests + w.digests 
  }), { lectures: 0, digests: 0 });

  const monthTotals = monthlyData.reduce((acc, m) => ({ 
    lectures: acc.lectures + m.lectures, 
    digests: acc.digests + m.digests 
  }), { lectures: 0, digests: 0 });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 mb-10">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">Activity</h3>
      <p className="text-xs text-muted-foreground mb-6">Track your lectures and digests over time.</p>

      <Tabs defaultValue="day" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="mt-0">
          {renderStatsCards(dayTotals, { lectures: 'Lectures (14 days)', digests: 'Digests (14 days)' })}
          {renderBarChart(recentDays, (item) => formatDate(item.date))}
        </TabsContent>

        <TabsContent value="week" className="mt-0">
          {renderStatsCards(weekTotals, { lectures: 'Lectures (8 weeks)', digests: 'Digests (8 weeks)' })}
          {renderBarChart(weeklyData, (item) => `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`)}
        </TabsContent>

        <TabsContent value="month" className="mt-0">
          {renderStatsCards(monthTotals, { lectures: 'Lectures (6 months)', digests: 'Digests (6 months)' })}
          {renderBarChart(monthlyData, (item) => formatMonthYear(item.date))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
