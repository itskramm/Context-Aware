import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Library, Sparkles, FileText, CheckCircle, Flame } from 'lucide-react';
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



  // Calculate activity streak from daily data
  const calculateStreak = (dailyData) => {
    if (!dailyData || dailyData.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort by date descending
    const sortedData = [...dailyData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (let i = 0; i < sortedData.length; i++) {
      const itemDate = new Date(sortedData[i].date);
      itemDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      // Check if this date has activity and matches expected date
      if (itemDate.getTime() === expectedDate.getTime() && 
          (sortedData[i].lectures > 0 || sortedData[i].digests > 0)) {
        streak++;
      } else if (itemDate.getTime() < expectedDate.getTime()) {
        break; // Gap in activity
      }
    }
    
    return streak;
  };

  // Calculate metrics for a given period's data
  const calculatePeriodMetrics = (data, fullAnalytics) => {
    const lectures = data.reduce((sum, d) => sum + d.lectures, 0);
    const digests = data.reduce((sum, d) => sum + d.digests, 0);
    const totalCreated = lectures + digests;
    
    return {
      lectures,
      digests,
      totalCreated,
      completionRate: fullAnalytics?.completionRate || 0,
      streak: calculateStreak(fullAnalytics?.dailyActivity || [])
    };
  };

  // Render stats cards with additional metrics
  const renderStatsCards = (metrics) => {
    return (
      <div className="space-y-4">
        {/* Main stats - Lectures and Digests */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-background/50 border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Library className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Lectures</p>
            </div>
            <p className="text-3xl font-bold">{metrics.lectures}</p>
          </div>
          <div className="rounded-xl bg-background/50 border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Digests</p>
            </div>
            <p className="text-3xl font-bold">{metrics.digests}</p>
          </div>
        </div>

        {/* Additional metrics - 3 smaller cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-background/50 border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Created</p>
            </div>
            <p className="text-lg font-bold">{metrics.totalCreated}</p>
          </div>
          
          <div className="rounded-lg bg-background/50 border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Overall Completion</p>
            </div>
            <p className="text-lg font-bold">{metrics.completionRate}%</p>
          </div>
          
          <div className="rounded-lg bg-background/50 border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Current Streak</p>
            </div>
            <p className="text-lg font-bold">{metrics.streak} {metrics.streak === 1 ? 'day' : 'days'}</p>
          </div>
        </div>
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

  // Calculate metrics for each period
  const dayMetrics = calculatePeriodMetrics(recentDays, analytics);
  const weekMetrics = calculatePeriodMetrics(weeklyData, analytics);
  const monthMetrics = calculatePeriodMetrics(monthlyData, analytics);

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
          {renderStatsCards(dayMetrics)}
        </TabsContent>

        <TabsContent value="week" className="mt-0">
          {renderStatsCards(weekMetrics)}
        </TabsContent>

        <TabsContent value="month" className="mt-0">
          {renderStatsCards(monthMetrics)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
