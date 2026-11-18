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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Download,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Play,
  Percent,
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
    
    // Comprehensive blacklist of generic words to filter
    const genericWords = new Set([
      'digest', 'tutorial', 'lecture', 'guide', 'overview', 'introduction', 
      'section', 'chapter', 'part', 'video', 'notes', 'summary', 'document'
    ]);
    
    // Common filler words that don't count as meaningful content
    const fillerWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been'
    ]);
    
    // Clean topic by removing generic words
    const cleanTopic = (topic) => {
      if (!topic || typeof topic !== 'string') return '';
      
      const words = topic.split(/\s+/);
      const cleanedWords = words.filter(word => {
        const lower = word.toLowerCase();
        return !genericWords.has(lower);
      });
      
      return cleanedWords.join(' ').trim();
    };
    
    // Check if topic is meaningful (not just generic words or numbers)
    const isMeaningfulTopic = (topic) => {
      if (!topic || topic.length < 3) return false;
      
      const lower = topic.toLowerCase().trim();
      
      // Reject if it's ONLY generic words
      if (genericWords.has(lower)) return false;
      
      // Reject patterns like "section 1", "chapter 3", "part 2"
      if (/^(section|chapter|part)\s*\d+$/i.test(lower)) return false;
      
      // Reject if only numbers
      if (/^\d+$/.test(lower)) return false;
      
      // Count meaningful words (not fillers)
      const words = lower.split(/\s+/).filter(w => w.length > 0);
      const meaningfulWords = words.filter(w => !fillerWords.has(w) && !genericWords.has(w));
      
      // Must have at least 2 meaningful words OR be a single word of 4+ chars
      if (meaningfulWords.length < 2 && !(meaningfulWords.length === 1 && meaningfulWords[0].length >= 4)) {
        return false;
      }
      
      return true;
    };
    
    // Check if query meets quality threshold
    const isQualityQuery = (query) => {
      if (!query || query.length < 10) return false;
      
      const lower = query.toLowerCase();
      
      // Count meaningful words
      const words = lower.replace(/[?.,!]/g, '').split(/\s+/).filter(w => w.length > 0);
      const meaningfulWords = words.filter(w => !fillerWords.has(w) && !genericWords.has(w));
      
      // Must have at least 2 meaningful words
      if (meaningfulWords.length < 2) return false;
      
      // Reject if it contains only generic combinations
      const hasOnlyGeneric = words.every(w => genericWords.has(w) || fillerWords.has(w));
      if (hasOnlyGeneric) return false;
      
      return true;
    };
    
    // Helper to add query if unique and meets quality threshold
    const addQuery = (query) => {
      if (!query) return;
      
      const trimmed = query.trim();
      if (!isQualityQuery(trimmed)) return;
      
      const normalized = trimmed.toLowerCase();
      if (seen.has(normalized)) return;
      
      seen.add(normalized);
      queries.push(trimmed);
    };
    
    // Extract topics from multiple sources
    const topicsArray = digest.content?.topics || digest.topics || [];
    const mainTopics = topicsArray.slice(0, 5).map(t => {
      const topicStr = typeof t === "string" ? t : (t.name || t.title || "");
      return cleanTopic(topicStr);
    }).filter(t => isMeaningfulTopic(t));
    
    // Extract segment topics (chapter/section names)
    const segmentTopics = segments.slice(0, 5).map(s => {
      const cleaned = cleanTopic(s.topic);
      return cleaned;
    }).filter(t => isMeaningfulTopic(t));
    
    // Combine all topics, prioritizing unique meaningful ones
    const allTopics = [...new Set([...mainTopics, ...segmentTopics])];
    
    // Only proceed if we have meaningful topics
    if (allTopics.length === 0) {
      return []; // Return empty array if no quality topics found
    }
    
    // Generate queries from topics with varied formats
    allTopics.slice(0, 4).forEach((topic, idx) => {
      if (idx === 0) {
        // First topic: "What is X?"
        addQuery(`What is ${topic}?`);
      } else if (idx === 1) {
        // Second topic: "X explained"
        addQuery(`${topic} explained`);
      } else if (idx === 2) {
        // Third topic: "X examples"
        addQuery(`${topic} examples`);
      } else {
        // Fourth topic: just the topic itself
        addQuery(topic);
      }
    });
    
    // Add learning goal if it's specific and meaningful
    if (digest.learning_goal && digest.learning_goal.length > 15) {
      const goal = digest.learning_goal;
      const lower = goal.toLowerCase();
      
      // Try to extract the key concept from patterns like "learn about X"
      const extractPattern = /(?:learn|understand|study|explore)\s+(?:about\s+)?(.+?)(?:\s+in|\s+for|\s+with|\s+through|$)/i;
      const match = goal.match(extractPattern);
      
      if (match && match[1]) {
        const extracted = cleanTopic(match[1]);
        if (isMeaningfulTopic(extracted)) {
          addQuery(`${extracted} overview`);
        }
      } else if (!lower.match(/^(learn|understand|study|explore)/i)) {
        // If it doesn't start with generic verbs, use as-is
        const cleaned = cleanTopic(goal);
        if (isMeaningfulTopic(cleaned)) {
          addQuery(cleaned);
        }
      }
    }
    
    // Add title-based query only if it's specific and meaningful
    if (digest.title && digest.title.length > 10) {
      const cleaned = cleanTopic(digest.title);
      if (isMeaningfulTopic(cleaned) && cleaned.length >= 10) {
        addQuery(cleaned);
      }
    }
    
    // Add comparison query if we have at least 2 good topics and need more queries
    if (queries.length < 5 && allTopics.length >= 2) {
      addQuery(`${allTopics[0]} vs ${allTopics[1]}`);
    }
    
    // Add "How to" query if we need more and have topics available
    if (queries.length < 5 && allTopics.length > 0) {
      addQuery(`How to use ${allTopics[0]}`);
    }
    
    // Return up to 6 queries, or empty array if none meet quality threshold
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
                <p className="text-sm text-muted-foreground">
                  No specific topics detected in this digest to explore further.
                </p>
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

      {/* Enhanced Query Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold pr-8">{selectedQuery}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Explore relevant content from your digest
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
                    This topic wasn't directly covered in the digest.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Try exploring other suggested topics or search the full transcript.
                  </p>
                </div>
              );
            }

            // Generate AI summary
            const generateSummary = () => {
              if (relevantContent.segments.length > 0) {
                const topics = relevantContent.segments.map(s => s.topic).join(', ');
                return `This section covers ${topics}. Found ${relevantContent.segments.length} segment${relevantContent.segments.length > 1 ? 's' : ''} and ${relevantContent.takeaways.length} key takeaway${relevantContent.takeaways.length !== 1 ? 's' : ''} related to this topic.`;
              }
              return `Found ${relevantContent.takeaways.length} key takeaway${relevantContent.takeaways.length !== 1 ? 's' : ''} and ${relevantContent.transcripts.length} transcript excerpt${relevantContent.transcripts.length !== 1 ? 's' : ''} about this topic.`;
            };

            // Calculate total duration covered
            const totalDuration = relevantContent.segments.reduce((sum, seg) => {
              return sum + (seg.end_time - seg.start_time);
            }, 0);

            // Calculate average relevance
            const avgRelevance = relevantContent.segments.length > 0
              ? Math.round(relevantContent.segments.reduce((sum, seg) => sum + seg.relevance_score, 0) / relevantContent.segments.length)
              : 0;

            // Copy all content function
            const copyAllContent = () => {
              let content = `${selectedQuery}\n\n`;
              
              if (relevantContent.takeaways.length > 0) {
                content += '## Key Takeaways\n';
                relevantContent.takeaways.forEach(t => content += `• ${t}\n`);
                content += '\n';
              }
              
              if (relevantContent.segments.length > 0) {
                content += '## Related Segments\n';
                relevantContent.segments.forEach(s => {
                  content += `[${s.start_label}] ${s.topic}\n`;
                  if (s.explanation) content += `${s.explanation}\n`;
                  content += '\n';
                });
              }
              
              if (relevantContent.transcripts.length > 0) {
                content += '## Transcript Excerpts\n';
                relevantContent.transcripts.forEach(t => {
                  content += `[${t.timestamp_label || fmtTime(t.timestamp)}] ${t.text}\n`;
                });
              }
              
              navigator.clipboard?.writeText(content);
              toast({ title: "Content copied to clipboard" });
            };

            // Download as markdown
            const downloadNotes = () => {
              const content = `# ${selectedQuery}\n\n${generateSummary()}\n\n` +
                (relevantContent.takeaways.length > 0 ? `## Key Takeaways\n${relevantContent.takeaways.map(t => `- ${t}`).join('\n')}\n\n` : '') +
                (relevantContent.segments.length > 0 ? `## Segments\n${relevantContent.segments.map(s => `### [${s.start_label}] ${s.topic}\n${s.explanation || ''}`).join('\n\n')}\n\n` : '') +
                (relevantContent.transcripts.length > 0 ? `## Transcript\n${relevantContent.transcripts.map(t => `**[${t.timestamp_label || fmtTime(t.timestamp)}]** ${t.text}`).join('\n\n')}` : '');
              
              const blob = new Blob([content], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              // Add timestamp to prevent filename collisions
              const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
              a.download = `${selectedQuery.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}.md`;
              a.click();
              URL.revokeObjectURL(url);
              toast({ title: "Notes downloaded" });
            };

            return (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Action Bar */}
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                  <Button size="sm" variant="outline" onClick={copyAllContent}>
                    <Copy className="w-3 h-3 mr-1.5" /> Copy All
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadNotes}>
                    <Download className="w-3 h-3 mr-1.5" /> Export
                  </Button>
                  <div className="flex-1" />
                  {avgRelevance > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {avgRelevance}% relevant
                    </Badge>
                  )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden mt-4">
                  <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="segments" className="text-xs sm:text-sm">
                      Segments ({relevantContent.segments.length})
                    </TabsTrigger>
                    <TabsTrigger value="transcript" className="text-xs sm:text-sm">
                      Transcript ({relevantContent.transcripts.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="flex-1 overflow-y-auto mt-4 space-y-4">
                    {/* AI Summary */}
                    <div className="rounded-lg border border-border bg-card p-4">
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Summary
                      </h4>
                      <p className="text-sm text-foreground leading-relaxed">
                        {generateSummary()}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <FileText className="w-3.5 h-3.5" /> Segments
                        </div>
                        <p className="text-xl font-bold text-foreground">{relevantContent.segments.length}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Clock className="w-3.5 h-3.5" /> Duration
                        </div>
                        <p className="text-xl font-bold text-foreground">{compactDuration(totalDuration)}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Percent className="w-3.5 h-3.5" /> Relevance
                        </div>
                        <p className="text-xl font-bold text-foreground">{avgRelevance}%</p>
                      </div>
                    </div>

                    {/* Key Takeaways */}
                    {relevantContent.takeaways.length > 0 && (
                      <div className="rounded-lg border border-border bg-card p-4">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4" /> Key Concepts
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

                    {/* Related Questions */}
                    {(() => {
                      // Filter out current query with case-insensitive comparison and deduplication
                      const uniqueQuestions = relatedQueries
                        .filter(q => q.toLowerCase().trim() !== selectedQuery?.toLowerCase().trim())
                        .filter((q, idx, arr) => 
                          // Keep only first occurrence of each normalized query
                          arr.findIndex(other => other.toLowerCase().trim() === q.toLowerCase().trim()) === idx
                        )
                        .slice(0, 3);
                      
                      return uniqueQuestions.length > 0 ? (
                        <div className="rounded-lg border border-border bg-card p-4">
                          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4" /> You might also want to know...
                          </h4>
                          <div className="space-y-2">
                            {uniqueQuestions.map((query, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedQuery(query)}
                                className="w-full text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors text-sm text-foreground flex items-center gap-2 group"
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                                <span className="flex-1">{query}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </TabsContent>

                  {/* Segments Tab */}
                  <TabsContent value="segments" className="flex-1 overflow-y-auto mt-4 space-y-3">
                    {relevantContent.segments.length > 0 ? (
                      relevantContent.segments.map((seg) => (
                        <Accordion key={seg.id} type="single" collapsible className="border-none">
                          <AccordionItem value={seg.id} className="rounded-lg border border-border bg-card">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 rounded-lg">
                              <div className="flex items-start justify-between gap-3 w-full pr-2">
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-sm text-foreground">{seg.topic}</h5>
                                    <Badge variant="secondary" className="text-xs">
                                      {seg.relevance_score}%
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {seg.start_label}
                                    </span>
                                    <span>•</span>
                                    <span>{compactDuration(seg.end_time - seg.start_time)}</span>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              {seg.explanation && (
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                  <Highlight text={seg.explanation} terms={relevantContent.queryTerms} />
                                </p>
                              )}
                              <Button
                                size="sm"
                                onClick={() => {
                                  seekTo(seg.start_time, seg.id);
                                  setModalOpen(false);
                                }}
                                className="w-full sm:w-auto"
                              >
                                <Play className="w-3 h-3 mr-1.5" />
                                Jump to this part
                              </Button>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No segments found for this topic</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Transcript Tab */}
                  <TabsContent value="transcript" className="flex-1 overflow-y-auto mt-4 space-y-3">
                    {relevantContent.transcripts.length > 0 ? (
                      <div className="space-y-2">
                        {relevantContent.transcripts.map((t, i) => (
                          <div 
                            key={t.id || i}
                            className="rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <button
                                onClick={() => {
                                  seekTo(t.timestamp, null);
                                  setModalOpen(false);
                                }}
                                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" />
                                {t.timestamp_label || fmtTime(t.timestamp)}
                              </button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard?.writeText(t.text);
                                  toast({ title: "Excerpt copied" });
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              <Highlight text={t.text || ""} terms={relevantContent.queryTerms} />
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No transcript excerpts found for this topic</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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