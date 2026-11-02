import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Upload, Link as LinkIcon, Loader2, Video, CheckCircle2, X, Youtube, FileVideo, AlertCircle, Info } from 'lucide-react';

export default function UploadLecture() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [instructor, setInstructor] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return null;

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 500MB',
        variant: 'destructive'
      });
      return null;
    }

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Supported: MP4, MOV, AVI, WebM, OGG, MP3, WAV, M4A',
        variant: 'destructive'
      });
      return null;
    }

    return selectedFile;
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    const validFile = validateFile(selectedFile);
    if (validFile) setFile(validFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const validFile = validateFile(droppedFiles[0]);
      if (validFile) setFile(validFile);
    }
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    
    if (!youtubeUrl || !title) {
      toast({
        title: 'Missing fields',
        description: 'YouTube URL and title are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Call the /api/lectures/youtube endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/lectures/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          youtubeUrl,
          title,
          course,
          instructor,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          uploadedBy: user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add YouTube lecture');
      }

      const data = await response.json();
      toast({ title: 'Success!', description: 'YouTube lecture added. Processing captions...' });
      navigate(`/lectures/${data.lecture.id}`);
    } catch (error) {
      toast({
        title: 'Failed',
        description: error.message || 'Could not add YouTube video',
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
        description: 'Title and file are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('course', course);
      formData.append('instructor', instructor);
      formData.append('uploadedBy', user.id);
      formData.append('tags', tags);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          toast({ title: 'Success!', description: 'File uploaded. Processing started.' });
          navigate(`/lectures/${response.lecture.id}`);
        } else {
          throw new Error(xhr.responseText || 'Upload failed');
        }
        setLoading(false);
      });

      xhr.addEventListener('error', () => {
        toast({
          title: 'Upload failed',
          description: 'Network error. Please try again.',
          variant: 'destructive'
        });
        setLoading(false);
      });

      xhr.open('POST', `${apiUrl}/lectures/upload`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload Lecture</h1>
        <p className="text-muted-foreground mt-2">Add a new lecture from YouTube or upload a file</p>
      </div>

      <Tabs defaultValue="youtube" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="youtube">
            <Youtube className="w-4 h-4 mr-2" />
            YouTube URL
          </TabsTrigger>
          <TabsTrigger value="file">
            <FileVideo className="w-4 h-4 mr-2" />
            Upload File
          </TabsTrigger>
        </TabsList>

        {/* YouTube Tab */}
        <TabsContent value="youtube">
          <Card>
            <CardHeader>
              <CardTitle>Add from YouTube</CardTitle>
              <CardDescription>
                Paste a YouTube URL to instantly fetch captions and metadata
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleYoutubeSubmit}>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    We'll automatically fetch captions if available, or transcribe the audio
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="youtube-url">YouTube URL *</Label>
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="youtube-title">Title *</Label>
                  <Input
                    id="youtube-title"
                    placeholder="Introduction to Machine Learning"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-course">Course</Label>
                    <Input
                      id="youtube-course"
                      placeholder="CS 101"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube-instructor">Instructor</Label>
                    <Input
                      id="youtube-instructor"
                      placeholder="Prof. Smith"
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="youtube-tags">Tags (optional)</Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Comma-separated tags for organization</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Input
                    id="youtube-tags"
                    placeholder="machine learning, python, algorithms"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding lecture...
                    </>
                  ) : (
                    <>
                      <Youtube className="w-4 h-4 mr-2" />
                      Add YouTube Lecture
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* File Upload Tab */}
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload a video or audio file (max 500MB)
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleFileSubmit}>
              <CardContent className="space-y-4">
                {/* Drag & Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium">Drag & drop your file here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                      <input
                        type="file"
                        accept="video/*,audio/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-input"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-input').click()}
                        disabled={loading}
                      >
                        Choose File
                      </Button>
                      <div className="flex flex-wrap justify-center gap-1 mt-3">
                        <Badge variant="secondary">MP4</Badge>
                        <Badge variant="secondary">MOV</Badge>
                        <Badge variant="secondary">AVI</Badge>
                        <Badge variant="secondary">MP3</Badge>
                        <Badge variant="secondary">WAV</Badge>
                      </div>
                    </div>
                  )}
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="file-title">Title *</Label>
                  <Input
                    id="file-title"
                    placeholder="Introduction to Calculus"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-course">Course</Label>
                    <Input
                      id="file-course"
                      placeholder="MATH 201"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-instructor">Instructor</Label>
                    <Input
                      id="file-instructor"
                      placeholder="Dr. Johnson"
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-tags">Tags (optional)</Label>
                  <Input
                    id="file-tags"
                    placeholder="calculus, limits, derivatives"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading || !file}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Process
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
