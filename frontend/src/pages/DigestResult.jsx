import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VideoPlayer from "@/components/VideoPlayer";
import YoutubePlayer from "@/components/YoutubePlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  getYoutubeId,
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
  const [relatedQueries, setRelatedQueries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dig = await base44.entities.Digest.get(id);
      setDigest(dig);
      const lecId = dig.lectureId || dig.lecture_id;
      if (!lecId) {
        setLoading(false);
        return;
      }
      // Parse "M:SS" or "H:MM:SS" timestamp string into seconds
      const parseTimestamp = (ts) => {
        if (!ts) return 0;
        const parts = String(ts).split(":").map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
      };
      const fmtSecs = (s) => {
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${String(sec).padStart(2, "0")}`;
      };

      // Segments live inside digest.content.chapters or digest.content.topics
      const contentTopics = dig.content?.topics || [];
      const contentChapters = dig.content?.chapters || [];
      const sourceList = contentChapters.length ? contentChapters : contentTopics;
      const mappedSegs = sourceList.map((t, i) => {
        const startSecs = parseTimestamp(
          typeof t === "object" ? (t.timestamp ?? t.startTime ?? t.start_time) : null
        );
        // Estimate end as start of next segment (or start + 5 min for last)
        const nextT = sourceList[i + 1];
        const endSecs = nextT
          ? parseTimestamp(typeof nextT === "object" ? (nextT.timestamp ?? nextT.startTime ?? nextT.start_time) : null)
          : startSecs + 300;
        return {
          id: `seg-${i}`,
          topic: typeof t === "string" ? t : t.name || t.title || `Section ${i + 1}`,
          explanation: typeof t === "object" ? t.description || t.summary || "" : "",
          start_time: startSecs,
          end_time: endSecs,
          start_label: fmtSecs(startSecs),
          end_label: fmtSecs(endSecs),
          relevance_score: Math.round(90 - i * 5) || 70, // descending relevance
        };
      });

      const [lec, trans] = await Promise.all([
        base44.entities.Lecture.get(lecId),
        base44.entities.Transcript.filter({ lecture_id: lecId }, "timestamp", 500),
      ]);
      setLecture(lec);
      setSegments(mappedSegs);
      setTranscripts(trans || []);
      
      // Generate related queries if not in digest (fallback for old digests)
      if (!dig.related_queries || dig.related_queries.length === 0) {
        const generatedQueries = generateRelatedQueries(dig, mappedSegs);
        setRelatedQueries(generatedQueries);
      } else {
        setRelatedQueries(dig.related_queries);
      }
      
      try {
        await base44.entities.UserInteraction.create({
          digest_id: id,
          lecture_id: lecId,
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

  // Format seconds to MM:SS for display
  const fmtTime = (secs) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Show all transcripts (segments don't have reliable time ranges from AI)
  // If segments have real timestamps, filter; otherwise show all
  const hasRealTimes = segments.some((s) => s.start_time > 0 || s.end_time > 0);
  const displayTranscripts = hasRealTimes
    ? transcripts.filter((t) =>
        segments.some((s) => t.timestamp >= s.start_time - 5 && t.timestamp <= s.end_time + 5)
      )
    : transcripts;

  const filteredTranscripts = search
    ? displayTranscripts.filter((t) => t.text?.toLowerCase().includes(search.toLowerCase()))
    : displayTranscripts;

  const terms = new Set();
  (digest?.topics || []).forEach((t) => t.toLowerCase().split(/\s+/).forEach((w) => { if (w.length > 3) terms.add(w); }));
  (digest?.learning_goal || "").toLowerCase().split(/\W+/).forEach((w) => { if (w.length > 4) terms.add(w); });
  const highlightTerms = [...terms];

  // Calculate digest duration if not available
  const getDigestDuration = () => {
    if (digest?.duration) return digest.duration;
    
    // Calculate from segments (which we already parsed from chapters)
    if (segments.length >= 2) {
      const firstStart = segments[0].start_time;
      const lastEnd = segments[segments.length - 1].end_time;
      if (lastEnd > firstStart) {
        return lastEnd - firstStart;
      }
    }
    
    // Fallback: use 30% of lecture duration as estimate
    if (lecture?.duration) {
      return Math.round(lecture.duration * 0.3);
    }
    
    return 0;
  };

  const digestDuration = getDigestDuration();

  // Extract relevant content for a query
  const getRelevantContent = (query) => {
    if (!query) return { takeaways: [], segments: [], transcripts: [] };
    
    // Extract key terms from query (remove common words)
    const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'how', 'to', 'explained', 'examples', 'overview', 'vs', 'use']);
    const queryTerms = query.toLowerCase()
      .replace(/[?.,!]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term));
    
    // Helper to check if text contains any query terms
    const containsTerms = (text) => {
      if (!text) return false;
      const lowerText = text.toLowerCase();
      return queryTerms.some(term => lowerText.includes(term));
    };
    
    // Find relevant takeaways
    const relevantTakeaways = (digest.content?.keyPoints || digest.key_takeaways || [])
      .filter(takeaway => containsTerms(takeaway));
    
    // Find relevant segments
    const relevantSegments = segments.filter(seg => 
      containsTerms(seg.topic) || containsTerms(seg.explanation)
    );
    
    // Find relevant transcript excerpts (limit to 5 most relevant)
    const relevantTranscripts = transcripts
      .filter(t => containsTerms(t.text))
      .slice(0, 5);
    
    return {
      takeaways: relevantTakeaways,
      segments: relevantSegments,
      transcripts: relevantTranscripts,
      queryTerms,
    };
  };

  // Handle query card click
  const handleQueryClick = (query) => {
    setSelectedQuery(query);
    setModalOpen(true);
  };

  // Generate related search queries from digest content (fallback for old digests)
  const generateRelatedQueries = (digest, segments) => {
    const queries = [];
    const seen = new Set(); // Track unique topics to avoid duplicates
    
    // Helper to add query if unique and meaningful
    const addQuery = (query) => {
      if (!query || query.length < 5) return; // Skip empty or too short
      const normalized = query.toLowerCase().trim();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      queries.push(query);
    };
    
    // Extract topics from multiple sources
    const topicsArray = digest.content?.topics || digest.topics || [];
    const mainTopics = topicsArray.slice(0, 3).map(t => 
      typeof t === "string" ? t : (t.name || t.title || "")
    ).filter(Boolean);
    
    // Extract segment topics (chapter/section names)
    const segmentTopics = segments.slice(0, 3).map(s => s.topic).filter(Boolean);
    
    // Combine all topics and remove generic words
    const allTopics = [...mainTopics, ...segmentTopics];
    const meaningfulTopics = allTopics.filter(topic => {
      const lower = topic.toLowerCase();
      // Filter out generic words like "introduction", "overview", "section 1", etc.
      return !lower.match(/^(introduction|overview|section \d+|chapter \d+|part \d+)$/i);
    });
    
    // Generate queries from topics with varied formats
    meaningfulTopics.slice(0, 3).forEach((topic, idx) => {
      if (idx === 0) {
        // First topic: "What is X?"
        addQuery(`What is ${topic}?`);
      } else if (idx === 1) {
        // Second topic: "X explained"
        addQuery(`${topic} explained`);
      } else {
        // Third topic: "X examples" or "Understanding X"
        addQuery(`${topic} examples`);
      }
    });
    
    // Add learning goal if it's specific enough
    if (digest.learning_goal && digest.learning_goal.length > 10) {
      const goal = digest.learning_goal;
      // Only add if not too generic
      if (!goal.toLowerCase().match(/learn|understand|study/i)) {
        addQuery(goal);
      } else {
        // Extract the key concept from learning goal
        const match = goal.match(/(?:learn|understand|study)\s+(?:about\s+)?(.+?)(?:\s+in|\s+for|\s+with|$)/i);
        if (match && match[1]) {
          addQuery(`${match[1]} overview`);
        }
      }
    }
    
    // Add title-based query if title is meaningful
    if (digest.title && digest.title.length > 5) {
      const title = digest.title;
      // Skip if title contains generic words like "digest"
      if (!title.toLowerCase().match(/digest|summary|notes/i)) {
        addQuery(title);
      }
    }
    
    // If we don't have enough queries yet, add "vs" comparison queries
    if (queries.length < 5 && meaningfulTopics.length >= 2) {
      addQuery(`${meaningfulTopics[0]} vs ${meaningfulTopics[1]}`);
    }
    
    // If still need more, add "How to use X" for first topic
    if (queries.length < 5 && meaningfulTopics.length > 0) {
      addQuery(`How to use ${meaningfulTopics[0]}`);
    }
    
    // Return 5-6 queries max
    return queries.slice(0, 6);
  };

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <MetaCard icon={BookOpen} label="Lecture" value={lecture?.title || "—"} />
        <MetaCard icon={Target} label="Learning goal" value={digest.learning_goal || "—"} />
        <MetaCard icon={Clock} label="Digest duration" value={digest.duration_label || compactDuration(digestDuration)} />
        <MetaCard icon={Clock} label="Lecture length" value={digest.lecture_duration_label || formatDuration(lecture?.duration)} />
        <MetaCard icon={Calendar} label="Created" value={relativeDate(digest.created_date || digest.createdAt)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: video + transcript */}
        <div className="lg:col-span-2 space-y-4">
          <div id="player">
            {(() => {
              const youtubeId = getYoutubeId(lecture?.videoUrl || lecture?.file_url || "");
              if (youtubeId) {
                return <YoutubePlayer ref={playerRef} videoId={youtubeId} className="aspect-video" />;
              }
              const fileUrl = lecture?.file_url || lecture?.fileUrl || lecture?.videoUrl;
              if (fileUrl) {
                return <VideoPlayer ref={playerRef} fileUrl={fileUrl} poster={lecture?.thumbnailUrl || lecture?.thumbnail_url} className="aspect-video" />;
              }
              return (
                <div className="aspect-video flex flex-col items-center justify-center bg-muted rounded-2xl gap-2">
                  <Clapperboard className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No video available</p>
                </div>
              );
            })()}
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
                  navigator.clipboard?.writeText(filteredTranscripts.map((t) => `[${fmtTime(t.timestamp)}] ${t.text}`).join("\n"));
                  toast({ title: "Transcript copied" });
                }}
              >
                <Copy className="w-4 h-4" /> Copy
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {filteredTranscripts.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  {transcripts.length === 0 ? "No transcript available for this lecture." : "No matching transcript."}
                </p>
              ) : (
                filteredTranscripts.map((t, i) => (
                  <TranscriptRow
                    key={t.id || i}
                    timestampLabel={t.timestamp_label || fmtTime(t.timestamp)}
                    onSeek={() => seekTo(t.timestamp, null)}
                    measureKey={`${t.text}|${search}`}
                  >
                    <Highlight text={t.text || ""} terms={search.trim() ? [search.trim()] : highlightTerms} />
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
              {(digest.content?.keyPoints || digest.key_takeaways || []).map((k, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground leading-relaxed">{k}</span>
                </li>
              ))}
              {(!(digest.content?.keyPoints || digest.key_takeaways)?.length) && (
                <li className="text-sm text-muted-foreground">No takeaways generated.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right: search queries + explanation */}
        <div className="space-y-4">
          {/* Topic-based search queries */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Relevant Segments
            </h3>
            <div className="space-y-2">
              {relatedQueries.length > 0 ? (
                relatedQueries.map((query, i) => (
                  <button
                    key={i}
                    onClick={() => handleQueryClick(query)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors text-sm text-foreground flex items-center gap-2 group"
                  >
                    <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    <span className="flex-1">{query}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No related queries available.</p>
              )}
            </div>
          </div>

          {/* Why selected */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{digest.content?.summary || digest.relevance_explanation || "No summary available."}</p>
            {(digest.content?.topics || digest.topics)?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(digest.content?.topics || digest.topics).map((t, i) => (
                  <Badge key={i} variant="secondary">{typeof t === "string" ? t : t.name || t}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DigestChat digest={digest} />

      {/* Query Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold pr-8">{selectedQuery}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Relevant information from the digest about this topic
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const relevantContent = getRelevantContent(selectedQuery);
            const hasContent = 
              relevantContent.takeaways.length > 0 || 
              relevantContent.segments.length > 0 || 
              relevantContent.transcripts.length > 0;

            if (!hasContent) {
              return (
                <div className="py-8 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No specific content found in the digest for this topic.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This query was generated based on the digest's main themes.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-6 pt-2">
                {/* Relevant Segments */}
                {relevantContent.segments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Related Segments ({relevantContent.segments.length})
                    </h4>
                    <div className="space-y-3">
                      {relevantContent.segments.map((seg) => (
                        <div 
                          key={seg.id}
                          className="rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h5 className="font-medium text-sm text-foreground">{seg.topic}</h5>
                            <button
                              onClick={() => {
                                seekTo(seg.start_time, seg.id);
                                setModalOpen(false);
                              }}
                              className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Clock className="w-3 h-3" />
                              {seg.start_label}
                            </button>
                          </div>
                          {seg.explanation && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              <Highlight text={seg.explanation} terms={relevantContent.queryTerms} />
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relevant Takeaways */}
                {relevantContent.takeaways.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" /> Related Takeaways ({relevantContent.takeaways.length})
                    </h4>
                    <ul className="space-y-2.5">
                      {relevantContent.takeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-foreground leading-relaxed">
                            <Highlight text={takeaway} terms={relevantContent.queryTerms} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Relevant Transcript Excerpts */}
                {relevantContent.transcripts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Relevant Transcript Excerpts ({relevantContent.transcripts.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {relevantContent.transcripts.map((t, i) => (
                        <div 
                          key={t.id || i}
                          className="rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <button
                              onClick={() => {
                                seekTo(t.timestamp, null);
                                setModalOpen(false);
                              }}
                              className="text-xs font-mono text-primary hover:underline"
                            >
                              {t.timestamp_label || fmtTime(t.timestamp)}
                            </button>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">
                            <Highlight text={t.text || ""} terms={relevantContent.queryTerms} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
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