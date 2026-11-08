import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Calendar, Shield, Loader2, Save, Library, Clapperboard, Eye, Camera, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Stats
  const [stats, setStats] = useState({ lectures: 0, digests: 0, views: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const [lectures, digests] = await Promise.all([
        base44.entities.Lecture.list('created_date', 500).catch(() => []),
        base44.entities.Digest.list('created_date', 500).catch(() => []),
      ]);
      const totalViews = lectures.reduce((sum, l) => sum + (l.view_count || 0), 0);
      setStats({
        lectures: lectures.length,
        digests: digests.length,
        views: totalViews,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileName = `profile-photos/${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const fileRef = storageRef(storage, fileName);
      
      await uploadBytes(fileRef, file);
      const photoURL = await getDownloadURL(fileRef);
      
      // Update user profile with photo URL
      await base44.patch('/auth/me', { photoURL });
      await refreshUser();
      
      toast({ title: 'Profile photo updated', description: 'Your profile picture has been changed successfully.' });
    } catch (err) {
      console.error('Photo upload error:', err);
      toast({ title: 'Failed to upload photo', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Please enter your name.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Update user via PATCH /auth/me endpoint
      await base44.patch('/auth/me', { name: name.trim() });
      await refreshUser(); // Reload user from backend
      setEditing(false);
      toast({ title: 'Profile updated', description: 'Your profile has been saved successfully.' });
    } catch (err) {
      toast({ title: 'Failed to update profile', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const joinedDate = user?.createdAt || user?.created_date || user?.joined_date;

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and account security.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-5 flex items-center gap-2">
            <Camera className="w-5 h-5 text-muted-foreground" />
            PROFILE PHOTO
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name || 'Profile'}
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-border flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a profile picture. Recommended: square image, max 5MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Upload className="w-4 h-4 mr-1" />
                )}
                Upload Photo
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              PROFILE INFORMATION
            </h3>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input value={email} disabled className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed. Contact support if needed.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); setName(user?.name || user?.full_name || ''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{user?.name || user?.full_name || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || 'Not set'}</p>
                </div>
              </div>
              {joinedDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{new Date(joinedDate).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              )}
              {user?.role && (
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{user.role}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity Stats */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            ACTIVITY OVERVIEW
          </h3>
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Library className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stats.lectures}</p>
                <p className="text-xs text-muted-foreground mt-1">Lecture{stats.lectures !== 1 ? 's' : ''}</p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Clapperboard className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stats.digests}</p>
                <p className="text-xs text-muted-foreground mt-1">Digest{stats.digests !== 1 ? 's' : ''}</p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Eye className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stats.views}</p>
                <p className="text-xs text-muted-foreground mt-1">Total view{stats.views !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
