import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Upload, Link as LinkIcon, Loader2, Video, CheckCircle2, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UploadLecture() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [purpose, setPurpose] = useState('general');
  const [file, setFile] = useState(null);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return null;

    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 500MB',
        variant: 'destructive'
      });
      return null;
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a video or audio file (MP4, MOV, AVI, WebM, OGG, MP3, WAV, M4A)',
        variant: 'destructive'
      });
      return null;
    }

    return selectedFile;
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    const validFile = validateFile(selectedFile);
    if (validFile) {
      setFile(validFile);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const validFile = validateFile(droppedFiles[0]);
      if (validFile) {
        setFile(validFile);
      }
    }
  };

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
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('uploadedBy', user.id);
      formData.append('tags', tags);
      formData.append('purpose', purpose);

      // Upload file to backend
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle response
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          console.log('XHR load event fired!');
          console.log('Status:', xhr.status);
          console.log('Response:', xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('Parsed response:', response);
              resolve(response);
            } catch (e) {
              console.error('Failed to parse response:', e);
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || error.message || 'Upload failed'));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          console.error('XHR error event');
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          console.error('XHR abort event');
          reject(new Error('Upload cancelled'));
        });

        // Set timeout to 2 minutes
        xhr.timeout = 120000;
        xhr.addEventListener('timeout', () => {
          console.error('XHR timeout event');
          reject(new Error('Upload timed out'));
        });
      });

      // Start upload
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      xhr.open('POST', `${apiUrl}/lectures/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);

      const response = await uploadPromise;
      console.log('Upload completed successfully!', response);

      toast({
        title: 'Upload successful!',
        description: 'Your file has been uploaded and processing will begin shortly.',
      });

      // Navigate immediately - don't wait for processing
      const lectureId = response.lecture?.id || response.id;
      console.log('Navigating to lecture:', lectureId);
      
      if (lectureId) {
        navigate(`/lectures/${lectureId}`);
      } else {
        console.warn('No lecture ID in response, navigating to /lectures');
        navigate('/lectures');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
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
          <form onSubmit={handleFileSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fileTitle">Lecture Title *</Label>
              <Input
                id="fileTitle"
                placeholder="Introduction to Machine Learning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Video/Audio File *</Label>
              {file ? (
                <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="w-10 h-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer block ${
                    isDragging
                      ? 'border-primary bg-primary/10 scale-[1.02]'
                      : 'border-border bg-muted/20 hover:bg-muted/30'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
                    isDragging ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                  }`}>
                    <Upload className={`w-8 h-8 transition-transform ${isDragging ? 'scale-110' : ''}`} />
                  </div>
                  <p className="text-lg font-semibold mb-2">
                    {isDragging ? 'Drop your file here' : 'Drag and drop your video here'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                  <p className="text-xs text-muted-foreground">Supported: MP4, MOV, AVI, WebM, OGG, MP3, WAV · Max 500MB</p>
                </label>
              )}
            </div>

            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fileTags">Tags (optional)</Label>
              <Input
                id="fileTags"
                placeholder="machine learning, AI, python"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Separate tags with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filePurpose">Purpose</Label>
              <select
                id="filePurpose"
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
              <Button type="submit" disabled={loading || !file} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : 'Processing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Upload & Create Lecture
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/lectures')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
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
