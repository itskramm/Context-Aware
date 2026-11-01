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
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload Lecture</h1>
        <p className="text-muted-foreground mt-2">
          Add a new lecture to your library for processing and digest generation
        </p>
      </div>

      <Tabs value={uploadMode} onValueChange={setUploadMode} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">
            <LinkIcon className="w-4 h-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="file" disabled>
            <Upload className="w-4 h-4 mr-2" />
            File Upload (Coming Soon)
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="file" className="mt-6">
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              File upload requires storage configuration
            </p>
            <p className="text-sm text-muted-foreground">
              Please use the URL tab to add lectures via video links
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold text-sm mb-2">💡 Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use descriptive titles for better organization</li>
          <li>• YouTube videos work best with public or unlisted visibility</li>
          <li>• Processing time varies based on video length</li>
          <li>• You'll be notified when processing is complete</li>
        </ul>
      </div>
    </div>
  );
}
