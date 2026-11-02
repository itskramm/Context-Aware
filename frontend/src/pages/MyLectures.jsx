import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  LayoutGrid,
  List,
  Film,
  Sparkles,
  Loader2,
  ArrowRight,
  Upload,
  Trash2,
} from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDuration,
  relativeDate,
} from "@/lib/lectureUtils";
import { toast } from "@/components/ui/use-toast";

export default function MyLectures() {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (lecture) => {
    if (!window.confirm(`Delete "${lecture.title}"? This removes the lecture and all its transcripts, topics, and digests. This cannot be undone.`)) return;
    setDeletingId(lecture.id);
    try {
      await base44.functions.invoke('deleteLecture', { lecture_id: lecture.id });
      setLectures((prev) => prev.filter((l) => l.id !== lecture.id));
      toast({ title: "Lecture deleted" });
    } catch (err) {
      toast({ title: "Could not delete lecture", description: err?.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Lecture.list("-created_date", 200);
      setLectures(res || []);
    } catch (err) {
      toast({ title: "Could not load lectures", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = new Set();
  lectures.forEach((l) => { if (l.course) set.add(l.course); });
  const courses = [...set].sort();

  let filtered = lectures;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((l) =>
      l.title?.toLowerCase().includes(q) ||
      l.course?.toLowerCase().includes(q) ||
      l.instructor?.toLowerCase().includes(q) ||
      l.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (course !== "all") filtered = filtered.filter((l) => l.course === course);
  filtered = [...filtered].sort((a, b) => {
    if (sort === "oldest") return new Date(a.created_date) - new Date(b.created_date);
    if (sort === "duration") return (b.duration || 0) - (a.duration || 0);
    return new Date(b.created_date) - new Date(a.created_date);
  });

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Lectures</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your lecture library.</p>
        </div>
        <Button onClick={() => navigate("/upload")}><Upload className="w-4 h-4 mr-1" /> Upload</Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search lectures…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="All courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="duration">Longest</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setView("grid")} className={`p-2.5 ${view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`} aria-label="Grid view">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={`p-2.5 ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`} aria-label="List view">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{lectures.length === 0 ? "No lectures yet." : "No lectures match your filters."}</p>
          {lectures.length === 0 && (
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate("/upload")}>Upload your first lecture</Button>
            </div>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((l) => <LectureGridCard key={l.id} lecture={l} onDelete={handleDelete} deleting={deletingId === l.id} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {filtered.map((l) => <LectureListRow key={l.id} lecture={l} onDelete={handleDelete} deleting={deletingId === l.id} />)}
        </div>
      )}
    </div>
  );
}

function LectureGridCard({ lecture, onDelete, deleting }) {
  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
      <Link to={`/lectures/${lecture.id}`} className="block">
        <div className="relative aspect-video bg-muted">
          {lecture.thumbnail_url ? (
            <img src={lecture.thumbnail_url} alt={lecture.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Film className="w-8 h-8" /></div>
          )}
          <span className={`absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[lecture.processing_status] || ""}`}>
            {STATUS_LABELS[lecture.processing_status] || lecture.processing_status}
          </span>
          <span className="absolute bottom-2 right-2 text-[11px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white">{lecture.duration_label || formatDuration(lecture.duration)}</span>
        </div>
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/lectures/${lecture.id}`}>
          <p className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">{lecture.title}</p>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">{lecture.course || "Uncategorized"}</p>
        <p className="text-xs text-muted-foreground mt-2">{relativeDate(lecture.created_date)}</p>
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={`/lectures/${lecture.id}`}>Open</Link>
          </Button>
          {lecture.processing_status === "ready" && (
            <Button asChild size="sm" className="flex-1">
              <Link to={`/generate-digest?lecture=${lecture.id}`}><Sparkles className="w-3.5 h-3.5 mr-1" /> Digest</Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDelete(lecture)} disabled={deleting} className="text-destructive hover:text-destructive px-2">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LectureListRow({ lecture, onDelete, deleting }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors">
      <Link to={`/lectures/${lecture.id}`} className="w-24 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
        {lecture.thumbnail_url ? (
          <img src={lecture.thumbnail_url} alt={lecture.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Film className="w-5 h-5" /></div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/lectures/${lecture.id}`} className="font-semibold text-sm hover:text-primary line-clamp-1">{lecture.title}</Link>
        <p className="text-xs text-muted-foreground mt-0.5">{lecture.course || "Uncategorized"} · {lecture.duration_label || formatDuration(lecture.duration)} · {relativeDate(lecture.created_date)}</p>
      </div>
      <Badge className={STATUS_STYLES[lecture.processing_status] || ""}>{STATUS_LABELS[lecture.processing_status] || lecture.processing_status}</Badge>
      <div className="flex gap-2 shrink-0">
        <Button asChild size="sm" variant="outline"><Link to={`/lectures/${lecture.id}`}>Open</Link></Button>
        {lecture.processing_status === "ready" && (
          <Button asChild size="sm"><Link to={`/generate-digest?lecture=${lecture.id}`}><Sparkles className="w-3.5 h-3.5 mr-1" /> Digest</Link></Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDelete(lecture)} disabled={deleting} className="text-destructive hover:text-destructive px-2">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}