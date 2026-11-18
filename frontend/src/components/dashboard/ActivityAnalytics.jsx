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

  // Bar Chart Component
  const BarChart = ({ data, type }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    
    // Calculate max value for scaling
    const maxValue = Math.max(
      ...data.map(item => item.lectures + item.digests),
      1 // Minimum of 1 to avoid division by zero
    );

    // Format label based on type
    const formatLabel = (item, index) => {
      if (type === 'day') {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      } else if (type === 'week') {
        const start = new Date(item.startDate);
        return `${start.getMonth() + 1}/${start.getDate()}`;
      } else {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short' });
      }
    };

    return (
      <div className="mt-6">
        <div className="flex items-end justify-between gap-1 h-[120px] px-2">
          {data.map((item, index) => {
            const lectureHeight = (item.lectures / maxValue) * 100;
            const digestHeight = (item.digests / maxValue) * 100;
            const totalHeight = lectureHeight + digestHeight;
            
            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center gap-1 relative group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {hoveredIndex === index && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap z-10 animate-in fade-in-0 zoom-in-95 duration-200">
                    <div className="font-semibold mb-1">{formatLabel(item, index)}</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-primary"></div>
                      <span>Lectures: {item.lectures}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-primary/40"></div>
                      <span>Digests: {item.digests}</span>
                    </div>
                  </div>
                )}
                
                {/* Bar */}
                <div className="w-full flex flex-col justify-end h-full">
                  {totalHeight > 0 ? (
                    <div 
                      className="w-full rounded-t-md transition-all duration-300 ease-out hover:opacity-80"
                      style={{ height: `${totalHeight}%` }}
                    >
                      {/* Digests (top part) */}
                      {digestHeight > 0 && (
                        <div 
                          className="w-full bg-primary/40 rounded-t-md transition-all duration-300"
                          style={{ height: `${(digestHeight / totalHeight) * 100}%` }}
                        />
                      )}
                      {/* Lectures (bottom part) */}
                      {lectureHeight > 0 && (
                        <div 
                          className="w-full bg-primary transition-all duration-300"
                          style={{ 
                            height: `${(lectureHeight / totalHeight) * 100}%`,
                            borderRadius: digestHeight === 0 ? '0.375rem 0.375rem 0 0' : '0'
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-1 bg-muted/30 rounded-full" />
                  )}
                </div>
                
                {/* Label */}
                <div className="text-[10px] text-muted-foreground mt-1 text-center">
                  {formatLabel(item, index)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary"></div>
            <span className="text-muted-foreground">Lectures</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
            <span className="text-muted-foreground">Digests</span>
          </div>
        </div>
      </div>
    );
  };

  // Render stats cards
  const renderStatsCards = (totals, labels) => {
    return (
      <div className="grid grid-cols-2 gap-4">
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
          {renderStatsCards(dayTotals, { lectures: 'Lectures', digests: 'Digests' })}
          {recentDays.length > 0 && <BarChart data={recentDays} type="day" />}
        </TabsContent>

        <TabsContent value="week" className="mt-0">
          {renderStatsCards(weekTotals, { lectures: 'Lectures', digests: 'Digests' })}
          {weeklyData.length > 0 && <BarChart data={weeklyData} type="week" />}
        </TabsContent>

        <TabsContent value="month" className="mt-0">
          {renderStatsCards(monthTotals, { lectures: 'Lectures', digests: 'Digests' })}
          {monthlyData.length > 0 && <BarChart data={monthlyData} type="month" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
