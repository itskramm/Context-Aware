import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Upload, Link as LinkIcon, Loader2, Video, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UploadLecture() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
  
  // Form states
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [purpose, setPurpose] = useState('general');
  const [file, setFile] = useState(null);

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !videoUrl) {
      toast({
        title: 'Missing fields',
        description: 'Please provide both title and video URL',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await base44.lectures.create({
        title,
        videoUrl, // Backend expects camelCase
        uploadedBy: user.id, // Backend expects camelCase
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        purpose
      });

      toast({
        title: 'Success!',
        description: 'Lecture created successfully. Processing will begin shortly.',
      });

      // Navigate to the lecture detail page
      if (response.lecture && response.lecture.id) {
        navigate(`/lectures/${response.lecture.id}`);
      } else if (response.id) {
        navigate(`/lectures/${response.id}`);
      } else {
        navigate('/lectures');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to create lecture. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !file) {
      toast({
        title: 'Missing fields',
        description: 'Please provide both title and video file',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // For now, we'll create a placeholder - file upload needs storage setup
      toast({
        title: 'File upload',
        description: 'File upload requires storage configuration. Please use URL upload for now.',
        variant: 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Upload Lecture</h1>
        <p className="text-muted-foreground mt-2">
          Upload a recording or paste a YouTube link to analyze and generate digests.
        </p>
      </div>

      {/* Warning banner */}
      <div className="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
        <div className="flex gap-3">
          <div className="text-amber-600 dark:text-amber-500 mt-0.5">⚠️</div>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Upload study-related videos only</p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              Use lecture recordings, lessons, tutorials, or other course material. Music videos, news clips, vlogs, and entertainment content are not supported and won't produce useful transcripts or digests.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={uploadMode} onValueChange={setUploadMode} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="file">
            <Upload className="w-4 h-4 mr-2" />
            Upload file
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="w-4 h-4 mr-2" />
            Paste link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold mb-2">Drag and drop your video here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
            <p className="text-xs text-muted-foreground">Supported: MP4, MOV, AVI, WebM, OGG · Max 500MB</p>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            File upload requires additional storage configuration. Use the "Paste link" tab for now.
          </p>
        </TabsContent>

        <TabsContent value="url" className="mt-6">
          <form onSubmit={handleUrlSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Lecture Title *</Label>
              <Input
                id="title"
                placeholder="Introduction to Machine Learning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Supports YouTube, Vimeo, and direct video URLs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                placeholder="machine learning, AI, python"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Separate tags with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <select
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="general">General Learning</option>
                <option value="exam">Exam Preparation</option>
                <option value="review">Quick Review</option>
                <option value="research">Research</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Lecture
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/lectures')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </TabsContent>

      </Tabs>
    </div>
  );
}
