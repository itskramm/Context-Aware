import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Upload, Loader2, CheckCircle2, X, Info, ExternalLink } from 'lucide-react';

export default function UploadLecture() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
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
        <p className="text-muted-foreground mt-2">Upload a video or audio file to process</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Upload a video or audio file (max 500MB)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleFileSubmit}>
          <CardContent className="space-y-4">
            {/* YouTube to MP4 Converter Info */}
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Need to download a YouTube video?</AlertTitle>
              <AlertDescription>
                Convert YouTube videos to MP4 files using{' '}
                <a 
                  href="https://y2mate.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  Y2mate
                  <ExternalLink className="h-3 w-3" />
                </a>
                {' '}— a free and trusted converter (third-party service). Download the video, then upload it here.
              </AlertDescription>
            </Alert>

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
              <div className="space-y-4 p-6 border border-border rounded-xl bg-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[60%]" />
                    <Skeleton className="h-3 w-[40%]" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Uploading your lecture...
                </p>
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
    </div>
  );
}
