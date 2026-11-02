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
  Clapperboard,
  Trash2,
  Play,
  Loader2,
  Sparkles,
  Clock,
  Target,
} from "lucide-react";
import { PURPOSE_LABELS, compactDuration, relativeDate } from "@/lib/lectureUtils";
import { toast } from "@/components/ui/use-toast";

export default function MyDigests() {
  const navigate = useNavigate();
  const [digests, setDigests] = useState([]);
  const [lectures, setLectures] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("all");
  const [topic, setTopic] = useState("all");
  const [sort, setSort] = useState("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [digRes, lecRes] = await Promise.all([
        base44.entities.Digest.list("-created_date", 200),
        base44.entities.Lecture.list("-created_date", 200),
      ]);
      setDigests(digRes || []);
      const map = {};
      (lecRes || []).forEach((l) => { map[l.id] = l; });
      setLectures(map);
    } catch (err) {
      toast({ title: "Could not load digests", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set1 = new Set();
  digests.forEach((d) => { const c = lectures[d.lecture_id]?.course; if (c) set1.add(c); });
  const courses = [...set1].sort();

  const set2 = new Set();
  digests.forEach((d) => (d.topics || []).forEach((t) => set2.add(t)));
  const topics = [...set2].sort();

  let filtered = digests;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((d) =>
      d.title?.toLowerCase().includes(q) ||
      d.learning_goal?.toLowerCase().includes(q) ||
      lectures[d.lecture_id]?.title?.toLowerCase().includes(q)
    );
  }
  if (course !== "all") filtered = filtered.filter((d) => lectures[d.lecture_id]?.course === course);
  if (topic !== "all") filtered = filtered.filter((d) => (d.topics || []).includes(topic));
  filtered = [...filtered].sort((a, b) => sort === "oldest"
    ? new Date(a.created_date) - new Date(b.created_date)
    : new Date(b.created_date) - new Date(a.created_date));

  const handleDelete = async (id) => {
    if (!confirm("Delete this digest?")) return;
    try {
      await base44.entities.DigestSegment.deleteMany({ digest_id: id });
      await base44.entities.Digest.delete(id);
      setDigests((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Digest deleted" });
    } catch (err) {
      toast({ title: "Could not delete", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Digests</h1>
          <p className="text-muted-foreground mt-1 text-sm">All your personalized lecture digests.</p>
        </div>
        <Button onClick={() => navigate("/generate-digest")}><Sparkles className="w-4 h-4 mr-1" /> Generate</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search digests…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="All courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="All topics" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Clapperboard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{digests.length === 0 ? "No digests yet." : "No digests match your filters."}</p>
          {digests.length === 0 && <Button className="mt-4" onClick={() => navigate("/generate-digest")}>Generate your first digest</Button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const lec = lectures[d.lecture_id];
            return (
              <div key={d.id} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clapperboard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/digests/${d.id}`} className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary">{d.title}</Link>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{lec?.title || "Lecture"}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Target className="w-3 h-3" /> <span className="line-clamp-1">{d.learning_goal || "—"}</span>
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{d.duration_label || compactDuration(d.duration)}</span>
                  <span>{relativeDate(d.created_date)}</span>
                </div>
                {d.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {d.topics.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[11px]">{t}</Badge>)}
                  </div>
                )}
                <div className="flex gap-2 mt-auto pt-3 border-t border-border">
                  <Button asChild size="sm" className="flex-1"><Link to={`/digests/${d.id}`}><Play className="w-3.5 h-3.5 mr-1" /> Watch</Link></Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(d.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}