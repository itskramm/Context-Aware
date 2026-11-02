import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  FileText,
  ListTree,
  Clapperboard,
  Info,
  Play,
  Search,
  Copy,
  Film,
  Clock,
  User,
  Calendar,
  BookOpen,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDuration,
  relativeDate,
  PROCESSING_STAGES,
  stageIndex,
  isYoutubeUrl,
  getYoutubeId,
} from "@/lib/lectureUtils";
import { toast } from "@/components/ui/use-toast";
import TranscriptRow from "@/components/TranscriptRow";

const TABS = [
  { key: "overview", label: "Overview", icon: Info },
  { key: "transcript", label: "Transcript", icon: FileText },
  { key: "topics", label: "Topics", icon: ListTree },
  { key: "digest", label: "Generate Digest", icon: Sparkles },
];

export default function LectureDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const playerRef = useRef(null);
  const [lecture, setLecture] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const lec = await base44.entities.Lecture.get(id);
      setLecture(lec);
      if (lec.processing_status === "ready") {
        try {
          const [t, tp] = await Promise.all([
            base44.entities.Transcript.filter({ lecture_id: id }, "timestamp", 500).catch(err => {
              console.error('Failed to load transcripts:', err);
              return [];
            }),
            base44.entities.Topic.filter({ lecture_id: id }, "start_time", 100).catch(err => {
              console.error('Failed to load topics:', err);
              return [];
            }),
          ]);
          setTranscripts(t || []);
          setTopics(tp || []);
          
          // If both are empty, might be index building
          if (t.length === 0 && tp.length === 0) {
            console.warn('No transcripts or topics loaded - Firebase indexes may still be building');
          }
        } catch (err) {
          console.error('Error loading transcript/topics:', err);
          // Don't block the page if transcripts/topics fail to load
        }
        
        // Record a view interaction + bump view count.
        try {
          await base44.entities.UserInteraction.create({
            lecture_id: id,
            interaction_type: "lecture_view",
          });
          await base44.entities.Lecture.update(id, { view_count: (lec.view_count || 0) + 1 });
        } catch {}
      }
    } catch (err) {
      console.error('Load lecture error:', err);
      toast({ title: "Could not load lecture", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const seekTo = (seconds) => {
    playerRef.current?.seek(seconds);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRegenerate = async () => {
    if (!window.confirm(`Regenerate the transcript for "${lecture.title}"? This will re-extract the transcript from the YouTube video and replace the current transcript and topics.`)) return;
    setRegenerating(true);
    try {
      await base44.functions.invoke('generateLectureAnalysis', {
        lecture_id: id,
        title: lecture.title,
        course: lecture.course,
        description: lecture.description,
        tags: lecture.tags,
        duration: lecture.duration,
        file_url: lecture.file_url,
        regenerate: true,
      });
      toast({ title: "Transcript regenerated", description: "The transcript has been updated with fresh content." });
      await load();
    } catch (err) {
      toast({ title: "Regeneration failed", description: err?.message, variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${lecture.title}"? This removes the lecture and all its transcripts, topics, and digests. This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.functions.invoke('deleteLecture', { lecture_id: id });
      toast({ title: "Lecture deleted" });
      navigate("/lectures");
    } catch (err) {
      setDeleting(false);
      toast({ title: "Could not delete lecture", description: err?.message, variant: "destructive" });
    }
  };

  // Jump to a timestamp from the ?t= query param (e.g. from search results).
  useEffect(() => {
    const t = searchParams.get("t");
    if (t && playerRef.current && lecture?.processing_status === "ready") {
      const seconds = parseFloat(t);
      const timer = setTimeout(() => playerRef.current?.seek(seconds), 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams, lecture]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground">Lecture not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/lectures")}>Back to lectures</Button>
      </div>
    );
  }

  const isReady = lecture.processing_status === "ready";
  const isProcessing = !isReady && lecture.processing_status !== "failed";

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <Link to="/lectures" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to lectures
      </Link>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{lecture.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              {lecture.course && <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lecture.course}</span>}
              {lecture.instructor && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{lecture.instructor}</span>}
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lecture.duration_label || formatDuration(lecture.duration)}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{relativeDate(lecture.lecture_date || lecture.created_date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_STYLES[lecture.processing_status] || ""}>
              {STATUS_LABELS[lecture.processing_status] || lecture.processing_status}
            </Badge>
            {lecture.file_url && (
              <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Regenerate transcript
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting} className="text-destructive hover:text-destructive">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Video player or processing state */}
      {isReady ? (
        <VideoPlayer ref={playerRef} fileUri={lecture.file_url} poster={lecture.thumbnail_url} className="aspect-video" />
      ) : isProcessing ? (
        <ProcessingBanner lecture={lecture} />
      ) : (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive font-medium">We couldn't finish analyzing this lecture. Please try again.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/upload")}>Re-upload</Button>
        </div>
      )}

      {/* Tabs */}
      {isReady && (
        <>
          <div className="flex gap-1 mt-6 border-b border-border overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                    active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {tab === "overview" && <OverviewTab lecture={lecture} topics={topics} transcripts={transcripts} />}
            {tab === "transcript" && (
              <TranscriptTab transcripts={transcripts} search={search} setSearch={setSearch} seekTo={seekTo} />
            )}
            {tab === "topics" && <TopicsTab topics={topics} seekTo={seekTo} />}
            {tab === "digest" && (
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold">Create a personalized digest</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Tell us what you want to learn, and we'll identify the most relevant parts of this lecture.
                </p>
                <Button className="mt-4" onClick={() => navigate(`/generate-digest?lecture=${id}`)}>
                  <Sparkles className="w-4 h-4 mr-1" /> Generate Digest
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Memoized components for better performance
function ProcessingBanner({ lecture }) {
  const idx = stageIndex(lecture.processing_status);
  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <div className="flex items-center gap-3 mb-5">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <div>
          <p className="font-semibold">{STATUS_LABELS[lecture.processing_status]}…</p>
          <p className="text-sm text-muted-foreground">Your lecture is being analyzed. This page will update shortly.</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {PROCESSING_STAGES.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div key={s.key} className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                done ? "bg-green-500 text-white" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={done || current ? "text-foreground font-medium" : "text-muted-foreground"}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

function OverviewTab({ lecture, topics, transcripts }) {
  const isYoutube = isYoutubeUrl(lecture.file_url);
  const videoId = getYoutubeId(lecture.file_url);
  const transcriptPreview = transcripts.slice(0, 3).map((t) => t.text).join(" ");

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {/* Video source */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2">
        <h3 className="font-semibold mb-3">Video source</h3>
        <div className="flex gap-4">
          {lecture.thumbnail_url && (
            <img
              src={lecture.thumbnail_url}
              alt="Video thumbnail"
              className="w-40 h-24 rounded-lg object-cover shrink-0 border border-border"
            />
          )}
          <div className="min-w-0 flex-1 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {isYoutube ? <Film className="w-4 h-4 text-muted-foreground" /> : <Clapperboard className="w-4 h-4 text-muted-foreground" />}
              <span className="font-medium">{isYoutube ? "YouTube video" : "Uploaded video file"}</span>
            </div>
            {lecture.file_url && (
              <a
                href={lecture.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline truncate"
                title={lecture.file_url}
              >
                {isYoutube ? `https://youtu.be/${videoId}` : lecture.file_url}
              </a>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lecture.duration_label || formatDuration(lecture.duration)}</span>
              {lecture.course && <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lecture.course}</span>}
              {lecture.instructor && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{lecture.instructor}</span>}
              <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{relativeDate(lecture.lecture_date || lecture.created_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description / content summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lecture.description || (transcriptPreview ? transcriptPreview : "No description available.")}
        </p>
        {lecture.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {lecture.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        )}
      </div>

      {/* Detected topics */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3">Detected topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics detected yet. Topics are generated by AI analysis and may be unavailable if processing limits are reached.</p>
          ) : (
            topics.map((t) => <Badge key={t.id} variant="outline">{t.topic_name}</Badge>)
          )}
        </div>
      </div>

      {/* Processing info */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2">
        <h3 className="font-semibold mb-3">Processing information</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-medium">{STATUS_LABELS[lecture.processing_status]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Transcript segments</p>
            <p className="font-medium">{transcripts.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Detected topics</p>
            <p className="font-medium">{topics.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TranscriptTab({ transcripts, search, setSearch, seekTo }) {
  const filtered = search
    ? transcripts.filter((t) => t.text.toLowerCase().includes(search.toLowerCase()))
    : transcripts;

  if (transcripts.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold">No transcript available</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          The transcript may still be processing. If this lecture was recently uploaded, please wait a few minutes and refresh the page. Firebase database indexes may also still be building.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh Page
        </Button>
      </div>
    );
  }

  return (
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
          onClick={() => { navigator.clipboard?.writeText(transcripts.map((t) => `${t.timestamp_label} ${t.text}`).join("\n")); toast({ title: "Transcript copied" }); }}
        >
          <Copy className="w-4 h-4" /> Copy
        </Button>
      </div>
      <div className="max-h-[28rem] overflow-y-auto divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No matching transcript segments.</p>
        ) : (
          filtered.map((t) => (
            <TranscriptRow
              key={t.id}
              timestampLabel={t.timestamp_label}
              onSeek={() => seekTo(t.timestamp)}
              measureKey={`${t.text}|${search}`}
            >
              {t.text}
            </TranscriptRow>
          ))
        )}
      </div>
    </div>
  );
}

function TopicsTab({ topics, seekTo }) {
  if (topics.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <ListTree className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold">No topics detected yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Topics are generated by AI analysis of the transcript. They may be unavailable if processing limits are reached. You can still browse the full transcript or generate a personalized digest.
        </p>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {topics.map((t) => (
        <button
          key={t.id}
          onClick={() => seekTo(t.start_time)}
          className="text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-start gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ListTree className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm block">{t.topic_name}</span>
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{t.start_label} – {t.end_label}</p>
            </div>
          </div>
          {t.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">{t.description}</p>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-primary mt-3">
            <Play className="w-3 h-3" /> Jump to {t.start_label}
          </span>
        </button>
      ))}
    </div>
  );
}