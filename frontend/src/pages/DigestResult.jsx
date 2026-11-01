import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Clock,
  Sparkles,
  Lightbulb,
  HelpCircle,
  Search,
  Copy,
  Clapperboard,
  BookOpen,
  Target,
  Calendar,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  formatDuration,
  compactDuration,
  relativeDate,
} from "@/lib/lectureUtils";
import DigestChat from "@/components/digest/DigestChat";
import SegmentCard from "@/components/digest/SegmentCard";
import TranscriptRow from "@/components/TranscriptRow";
import { toast } from "@/components/ui/use-toast";

export default function DigestResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [digest, setDigest] = useState(null);
  const [lecture, setLecture] = useState(null);
  const [segments, setSegments] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dig = await base44.entities.Digest.get(id);
      setDigest(dig);
      const [lec, segs, trans] = await Promise.all([
        base44.entities.Lecture.get(dig.lecture_id),
        base44.entities.DigestSegment.filter({ digest_id: id }, "start_time", 100),
        base44.entities.Transcript.filter({ lecture_id: dig.lecture_id }, "timestamp", 500),
      ]);
      setLecture(lec);
      setSegments((segs || []).slice().sort((a, b) => (Number(b.relevance_score) || 0) - (Number(a.relevance_score) || 0)));
      setTranscripts(trans || []);
      try {
        await base44.entities.UserInteraction.create({
          digest_id: id,
          lecture_id: dig.lecture_id,
          interaction_type: "digest_view",
        });
      } catch {}
    } catch (err) {
      toast({ title: "Could not load digest", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const seekTo = (seconds, segId) => {
    playerRef.current?.seek(seconds);
    setActiveSegment(segId);
    document.getElementById("player")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Transcript segments that fall within the digest's selected segments.
  const digestTranscripts = useMemo(() => {
    if (!segments.length || !transcripts.length) return [];
    return transcripts.filter((t) =>
      segments.some((s) => t.timestamp >= s.start_time - 5 && t.timestamp <= s.end_time + 5)
    );
  }, [segments, transcripts]);

  const filteredTranscripts = search
    ? digestTranscripts.filter((t) => t.text.toLowerCase().includes(search.toLowerCase()))
    : digestTranscripts;

  const highlightTerms = useMemo(() => {
    const terms = new Set();
    (digest?.topics || []).forEach((t) => t.toLowerCase().split(/\s+/).forEach((w) => { if (w.length > 3) terms.add(w); }));
    (digest?.learning_goal || "").toLowerCase().split(/\W+/).forEach((w) => { if (w.length > 4) terms.add(w); });
    return [...terms];
  }, [digest]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!digest) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto">
        <p className="text-muted-foreground">Digest not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/digests")}>Back to digests</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Delete this digest? This cannot be undone.")) return;
    try {
      await base44.entities.DigestSegment.deleteMany({ digest_id: id });
      await base44.entities.Digest.delete(id);
      toast({ title: "Digest deleted" });
      navigate("/digests");
    } catch (err) {
      toast({ title: "Could not delete", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/digests" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to digests
        </Link>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
          <Trash2 className="w-4 h-4" /> Delete
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Your Personalized Digest</h1>
        </div>
        <p className="text-lg font-medium text-foreground">{digest.title}</p>
        {digest.is_demo && (
          <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
            Demo data
          </Badge>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetaCard icon={BookOpen} label="Lecture" value={lecture?.title || "—"} />
        <MetaCard icon={Target} label="Learning goal" value={digest.learning_goal || "—"} />
        <MetaCard icon={Clock} label="Digest duration" value={digest.duration_label || compactDuration(digest.duration)} />
        <MetaCard icon={Clock} label="Lecture length" value={digest.lecture_duration_label || formatDuration(digest.lecture_duration)} />
        <MetaCard icon={Sparkles} label="Time saved" value={digest.estimated_time_saved_label || compactDuration(digest.estimated_time_saved)} />
        <MetaCard icon={Calendar} label="Created" value={relativeDate(digest.created_date)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: video + transcript */}
        <div className="lg:col-span-2 space-y-4">
          <div id="player">
            <VideoPlayer ref={playerRef} fileUri={lecture?.file_url} poster={lecture?.thumbnail_url} className="aspect-video" />
          </div>

          {/* Transcript panel */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search transcript…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(digestTranscripts.map((t) => `${t.timestamp_label} ${t.text}`).join("\n"));
                  toast({ title: "Transcript copied" });
                }}
              >
                <Copy className="w-4 h-4" /> Copy
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {filteredTranscripts.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">No matching transcript.</p>
              ) : (
                filteredTranscripts.map((t) => (
                  <TranscriptRow
                    key={t.id}
                    timestampLabel={t.timestamp_label}
                    onSeek={() => seekTo(t.timestamp, null)}
                    measureKey={`${t.text}|${search}`}
                  >
                    <Highlight text={t.text} terms={search.trim() ? [search.trim()] : highlightTerms} />
                  </TranscriptRow>
                ))
              )}
            </div>
          </div>

          {/* Key takeaways */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" /> Key Takeaways
            </h3>
            <ul className="space-y-2.5">
              {(digest.key_takeaways || []).map((k, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground leading-relaxed">{k}</span>
                </li>
              ))}
              {(!digest.key_takeaways || digest.key_takeaways.length === 0) && (
                <li className="text-sm text-muted-foreground">No takeaways generated.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right: segments + explanation */}
        <div className="space-y-4">
          {/* Relevant segments */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Relevant Segments</h3>
            <div className="space-y-2.5">
              {segments.map((s) => (
                <SegmentCard
                  key={s.id}
                  segment={s}
                  active={activeSegment === s.id}
                  onSeek={() => seekTo(s.start_time, s.id)}
                />
              ))}
            </div>
          </div>

          {/* Why selected */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> Why these sections were selected
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{digest.relevance_explanation}</p>
            {digest.topics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {digest.topics.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <DigestChat digest={digest} />
    </div>
  );
}

function MetaCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-sm font-medium text-foreground line-clamp-2" title={value}>{value}</p>
    </div>
  );
}

function Highlight({ text, terms }) {
  if (!terms.length) return text;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    terms.some((t) => t.toLowerCase() === p.toLowerCase())
      ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{p}</mark>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}