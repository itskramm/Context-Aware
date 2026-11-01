import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Sparkles,
  Library,
  Clapperboard,
  Eye,
  Clock,
  Play,
  ArrowRight,
  Loader2,
  Film,
} from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDuration,
  compactDuration,
  relativeDate,
} from "@/lib/lectureUtils";
import { toast } from "@/components/ui/use-toast";
import LectureContentWarning from "@/components/LectureContentWarning";
import ActivityAnalytics from "@/components/dashboard/ActivityAnalytics";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="w-8 h-8 rounded-lg gradient-brand text-white flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight mt-2">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function LectureCard({ lecture }) {
  return (
    <Link
      to={`/lectures/${lecture.id}`}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="relative aspect-video bg-muted">
        {lecture.thumbnail_url ? (
          <img src={lecture.thumbnail_url} alt={lecture.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Film className="w-8 h-8" />
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[lecture.processing_status] || ""}`}>
          {STATUS_LABELS[lecture.processing_status] || lecture.processing_status}
        </span>
        <span className="absolute bottom-2 right-2 text-[11px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white">
          {lecture.duration_label || formatDuration(lecture.duration)}
        </span>
      </div>
      <div className="p-4">
        <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {lecture.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{lecture.course || "Uncategorized"}</p>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>{relativeDate(lecture.created_date)}</span>
          <span className="inline-flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Open <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function DigestCard({ digest, lecture }) {
  return (
    <Link
      to={`/digests/${digest.id}`}
      className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Clapperboard className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {digest.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {lecture?.title || "Lecture"}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {digest.duration_label || compactDuration(digest.duration)}
            </span>
            <span>{relativeDate(digest.created_date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState([]);
  const [digests, setDigests] = useState([]);
  const [lectureMap, setLectureMap] = useState({});
  const [totalSaved, setTotalSaved] = useState(0);

  const firstName = (user?.name || user?.full_name || user?.email?.split("@")[0] || "there").split(" ")[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lecRes, digRes] = await Promise.all([
        base44.entities.Lecture.list("-created_date", 50),
        base44.entities.Digest.list("-created_date", 50),
      ]);
      const lecs = lecRes || [];
      const digs = digRes || [];
      setLectures(lecs);
      setDigests(digs);
      const map = {};
      lecs.forEach((l) => { map[l.id] = l; });
      setLectureMap(map);
      setTotalSaved(digs.reduce((sum, d) => sum + (d.estimated_time_saved || 0), 0));
    } catch (err) {
      toast({ title: "Could not load dashboard", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recentLectures = lectures.slice(0, 4);
  const recentDigests = digests.slice(0, 3);
  const continueItem = recentDigests[0];

  return (
    <div className="p-6 sm:p-8">
      {/* Greeting */}
      <div className="mb-8 rounded-3xl border border-border gradient-brand-soft p-6 sm:p-7">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Good day, {firstName}</h1>
        <p className="text-muted-foreground mt-1.5">
          Review your lectures faster with personalized video digests.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <Button size="lg" className="h-11" onClick={() => navigate("/upload")}>
            <Upload className="w-4 h-4 mr-1" />
            Upload Lecture
          </Button>
          <Button size="lg" variant="outline" className="h-11" onClick={() => navigate("/generate-digest")}>
            <Sparkles className="w-4 h-4 mr-1" />
            Generate Digest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Library} label="Total Lectures" value={lectures.length} />
        <StatCard icon={Clapperboard} label="Total Digests" value={digests.length} />
        <StatCard icon={Eye} label="Recently Viewed" value={lectures.filter((l) => l.view_count > 0).length} />
        <StatCard
          icon={Clock}
          label="Review Time Saved"
          value={compactDuration(totalSaved)}
          sub="across all digests"
        />
      </div>

      <ActivityAnalytics />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Continue learning */}
          {continueItem && (
            <div className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Continue Learning
              </h2>
              <Link
                to={`/digests/${continueItem.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border gradient-brand-soft p-5 hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 rounded-xl gradient-brand text-white flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{continueItem.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {lectureMap[continueItem.lecture_id]?.title || "Lecture"} · {continueItem.duration_label || compactDuration(continueItem.duration)}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            </div>
          )}

          {/* Recent lectures */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Lectures</h2>
              <Link to="/lectures" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            <LectureContentWarning className="mb-4" />
            {recentLectures.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No lectures yet. Upload your first lecture to get started.</p>
                <Button className="mt-4" onClick={() => navigate("/upload")}>
                  <Upload className="w-4 h-4 mr-1" /> Upload Lecture
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentLectures.map((l) => <LectureCard key={l.id} lecture={l} />)}
              </div>
            )}
          </div>

          {/* Recent digests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Digests</h2>
              <Link to="/digests" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {recentDigests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No digests yet. Generate one from any lecture.</p>
                <Button className="mt-4" variant="outline" onClick={() => navigate("/generate-digest")}>
                  <Sparkles className="w-4 h-4 mr-1" /> Generate Digest
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDigests.map((d) => <DigestCard key={d.id} digest={d} lecture={lectureMap[d.lecture_id]} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}