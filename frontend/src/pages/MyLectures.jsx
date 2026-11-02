import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  Upload,
  Trash2,
  MoreVertical,
  Eye,
  Edit,
  Share2,
  Calendar,
  Clock,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState(null);

  const handleDeleteClick = (lecture) => {
    setLectureToDelete(lecture);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!lectureToDelete) return;
    setDeletingId(lectureToDelete.id);
    setDeleteDialogOpen(false);
    
    try {
      await base44.functions.invoke('deleteLecture', { lecture_id: lectureToDelete.id });
      setLectures((prev) => prev.filter((l) => l.id !== lectureToDelete.id));
      toast({ title: "Lecture deleted successfully" });
    } catch (err) {
      toast({ 
        title: "Could not delete lecture", 
        description: err?.message, 
        variant: "destructive" 
      });
    } finally {
      setDeletingId(null);
      setLectureToDelete(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Lecture.list("-created_date", 200);
      setLectures(res || []);
    } catch (err) {
      toast({ 
        title: "Could not load lectures", 
        description: err?.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = new Set();
  (lectures || []).forEach((l) => { if (l?.course) set.add(l.course); });
  const courses = [...set].sort();

  let filtered = lectures || [];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((l) =>
      l?.title?.toLowerCase().includes(q) ||
      l?.course?.toLowerCase().includes(q) ||
      (l?.tags || []).some((t) => t?.toLowerCase().includes(q))
    );
  }
  if (course !== "all") filtered = filtered.filter((l) => l?.course === course);
  filtered = [...filtered].sort((a, b) => {
    if (sort === "oldest") return new Date(a?.created_date || 0) - new Date(b?.created_date || 0);
    if (sort === "duration") return (b?.duration || 0) - (a?.duration || 0);
    return new Date(b?.created_date || 0) - new Date(a?.created_date || 0);
  });

  return (
    <div className="container max-w-7xl mx-auto p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Lectures</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your lecture library</p>
        </div>
        <Button onClick={() => navigate("/upload")} size="lg">
          <Upload className="w-4 h-4 mr-2" /> 
          Upload Lecture
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by title, course, or tags..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-10" 
              />
            </div>
            
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="duration">Longest first</SelectItem>
              </SelectContent>
            </Select>
            
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v)}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <LectureGridSkeleton view={view} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Film className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {lectures.length === 0 ? "No lectures yet" : "No lectures found"}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {lectures.length === 0 
                ? "Upload your first lecture to get started with AI-powered transcription and analysis."
                : "Try adjusting your filters or search query."}
            </p>
            {lectures.length === 0 && (
              <Button onClick={() => navigate("/upload")} size="lg">
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Lecture
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((l) => (
            <LectureGridCard 
              key={l.id} 
              lecture={l} 
              onDelete={handleDeleteClick} 
              deleting={deletingId === l.id} 
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {filtered.map((l) => (
              <LectureListRow 
                key={l.id} 
                lecture={l} 
                onDelete={handleDeleteClick} 
                deleting={deletingId === l.id} 
              />
            ))}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lecture?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{lectureToDelete?.title}" and all associated transcripts, topics, and digests. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LectureGridCard({ lecture, onDelete, deleting }) {
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all">
      <Link to={`/lectures/${lecture.id}`}>
        <div className="relative aspect-video bg-muted">
          {lecture.thumbnail_url ? (
            <img 
              src={lecture.thumbnail_url} 
              alt={lecture.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <Badge 
            className={`absolute top-2 left-2 ${STATUS_STYLES[lecture.processing_status] || ""}`}
            variant="secondary"
          >
            {STATUS_LABELS[lecture.processing_status] || lecture.processing_status}
          </Badge>
          {lecture.duration > 0 && (
            <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
              {formatDuration(lecture.duration)}
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Link to={`/lectures/${lecture.id}`}>
                <h3 className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
                  {lecture.title}
                </h3>
              </Link>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">{lecture.title}</h4>
                {lecture.course && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Film className="w-3 h-3" />
                    {lecture.course}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {relativeDate(lecture.created_date)}
                </div>
                {lecture.duration > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDuration(lecture.duration)}
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/lectures/${lecture.id}`)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {lecture.processing_status === "ready" && (
                <DropdownMenuItem onClick={() => navigate(`/generate-digest?lecture=${lecture.id}`)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Digest
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(lecture)}
                className="text-destructive focus:text-destructive"
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">{lecture.course || "Uncategorized"}</p>
          <p className="text-xs text-muted-foreground">{relativeDate(lecture.created_date)}</p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link to={`/lectures/${lecture.id}`}>
            <Eye className="w-3.5 h-3.5 mr-1" />
            Open
          </Link>
        </Button>
        {lecture.processing_status === "ready" && (
          <Button asChild size="sm" className="flex-1">
            <Link to={`/generate-digest?lecture=${lecture.id}`}>
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Digest
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function LectureListRow({ lecture, onDelete, deleting }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
      <Link to={`/lectures/${lecture.id}`} className="shrink-0">
        <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted">
          {lecture.thumbnail_url ? (
            <img src={lecture.thumbnail_url} alt={lecture.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/lectures/${lecture.id}`}>
          <h3 className="font-semibold hover:text-primary transition-colors truncate">
            {lecture.title}
          </h3>
        </Link>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          {lecture.course && <span>{lecture.course}</span>}
          <span className="text-muted-foreground/50">•</span>
          <span>{relativeDate(lecture.created_date)}</span>
          {lecture.duration > 0 && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span>{formatDuration(lecture.duration)}</span>
            </>
          )}
        </div>
      </div>

      <Badge variant="secondary" className={STATUS_STYLES[lecture.processing_status] || ""}>
        {STATUS_LABELS[lecture.processing_status] || lecture.processing_status}
      </Badge>

      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to={`/lectures/${lecture.id}`}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Link>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {lecture.processing_status === "ready" && (
              <DropdownMenuItem onClick={() => navigate(`/generate-digest?lecture=${lecture.id}`)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Digest
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(lecture)}
              className="text-destructive focus:text-destructive"
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function LectureGridSkeleton({ view }) {
  if (view === "list") {
    return (
      <Card>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="w-32 h-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
          <CardFooter className="p-4 pt-0 gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
