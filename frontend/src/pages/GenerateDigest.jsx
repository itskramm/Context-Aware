import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Target,
  Tag,
  History,
  X,
  ArrowLeft,
  Library,
} from "lucide-react";
import {
  formatDuration,
  compactDuration,
} from "@/lib/lectureUtils";
import { toast } from "@/components/ui/use-toast";

const GEN_STAGES = [
  "Understanding lecture structure",
  "Processing transcript",
  "Matching your learning goal",
  "Identifying relevant segments",
  "Organizing digest",
  "Finalizing personalized digest",
];

export default function GenerateDigest() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetLecture = params.get("lecture");
  const learningGoalRef = useRef(null);

  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStage, setGenStage] = useState(0);

  const [lectureId, setLectureId] = useState(presetLecture || "");
  const [learningGoal, setLearningGoal] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState([]);
  const [useHistory, setUseHistory] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Lecture.filter({ processing_status: "ready" }, "-created_date", 100);
      setLectures(res || []);
      if (presetLecture && res?.some((l) => l.id === presetLecture)) {
        setLectureId(presetLecture);
        // Auto-focus on learning goal input after preset
        setTimeout(() => {
          learningGoalRef.current?.focus();
        }, 100);
      }
    } catch (err) {
      toast({ title: "Could not load lectures", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [presetLecture]);

  useEffect(() => { load(); }, [load]);

  const addTopic = () => {
    const t = topicInput.trim();
    if (t && !topics.includes(t)) setTopics([...topics, t]);
    setTopicInput("");
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    if (!lectureId) { setError("Please select a lecture first."); return; }
    if (!learningGoal.trim()) { setError("Please tell us what you want to learn before generating a digest."); return; }

    setGenerating(true);
    setGenStage(0);
    try {
      // Animate processing stages while the backend analyzes the transcript.
      const stageTimer = setInterval(() => {
        setGenStage((prev) => Math.min(prev + 1, GEN_STAGES.length - 1));
      }, 900);

      const response = await base44.functions.invoke('generateDigest', {
        lecture_id: lectureId,
        learning_goal: learningGoal.trim(),
        topics,
        use_history: useHistory,
      });

      clearInterval(stageTimer);
      setGenStage(GEN_STAGES.length - 1);

      const result = response?.data || response;
      if (result?.error) {
        setError(result.error);
        setGenerating(false);
        clearInterval(stageTimer);
        toast({ title: "Generation failed", description: result.error, variant: "destructive" });
        return;
      }

      const digestId = result?.digest_id;
      if (!digestId) {
        setError("Could not generate digest. Please try again.");
        setGenerating(false);
        clearInterval(stageTimer);
        toast({ title: "Generation failed", description: "Could not generate digest", variant: "destructive" });
        return;
      }

      toast({ title: "Digest ready", description: "Opening your personalized digest…" });
      setTimeout(() => navigate(`/digests/${digestId}`), 600);
    } catch (err) {
      const isNetworkError = err?.message?.toLowerCase().includes('network') || 
                            err?.message?.toLowerCase().includes('fetch') ||
                            !err?.response;
      const msg = isNetworkError 
        ? "Check your connection and try again" 
        : (err?.response?.data?.error || err?.message || "We couldn't generate your digest. Please try again.");
      setError(msg);
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="space-y-4 p-6 border border-border rounded-xl bg-card">
          <Skeleton className="h-6 w-[70%] mb-2" />
          <Skeleton className="h-2 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            {GEN_STAGES[genStage]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Create a personalized digest</h1>
        </div>
        <p className="text-muted-foreground">
          Tell us what you want to learn, and the system will identify the most relevant parts of the lecture.
        </p>
        {presetLecture && lectureId && lectures.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary">
              Now generate a digest for <span className="font-semibold">'{lectures.find(l => l.id === lectureId)?.title}'</span>
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : lectures.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Library className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">You need at least one processed lecture to generate a digest.</p>
          <Button className="mt-4" onClick={() => navigate("/upload")}>Upload a lecture</Button>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Lecture selection */}
          <div className="space-y-2">
            <Label>Select a lecture</Label>
            <Select value={lectureId} onValueChange={setLectureId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a lecture…" /></SelectTrigger>
              <SelectContent>
                {lectures.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.title} {l.course ? `· ${l.course}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Learning goal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Target className="w-4 h-4" /> Learning goal</Label>
            <Textarea
              ref={learningGoalRef}
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="I want to review database normalization for my exam."
              rows={3}
            />
          </div>

          {/* Topics of interest */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Topics of interest</Label>
            <div className="flex gap-2">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }}
                placeholder="e.g. Normalization, 1NF, 2NF"
              />
              <Button type="button" variant="outline" onClick={addTopic}>Add</Button>
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {topics.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button type="button" onClick={() => setTopics(topics.filter((x) => x !== t))} className="ml-0.5 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Personalization toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <History className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Use my previous activity to personalize</p>
                <p className="text-xs text-muted-foreground mt-0.5">Consider your past digests and viewed topics.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useHistory}
              onClick={() => setUseHistory(!useHistory)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${useHistory ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${useHistory ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <Button type="submit" size="lg" className="w-full">
            <Sparkles className="w-4 h-4 mr-1" /> Generate Personalized Digest
          </Button>
        </form>
      )}
    </div>
  );
}