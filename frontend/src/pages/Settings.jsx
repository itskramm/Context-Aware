import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Sliders, Shield, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  // Preferences state
  const [digestDepth, setDigestDepth] = useState('standard');
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');
  const [notifications, setNotifications] = useState(true);
  
  // Delete loading states
  const [deletingLectures, setDeletingLectures] = useState(false);
  const [deletingDigests, setDeletingDigests] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const prefs = localStorage.getItem('userPreferences');
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        setDigestDepth(parsed.digestDepth || 'standard');
        setPlaybackSpeed(parsed.playbackSpeed || '1x');
        setNotifications(parsed.notifications !== false);
      } catch {}
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const savePreference = (key, value) => {
    const prefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    prefs[key] = value;
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
    toast({ title: 'Preference saved', description: 'Your settings have been updated.' });
  };

  const handleDigestDepthChange = (value) => {
    setDigestDepth(value);
    savePreference('digestDepth', value);
  };

  const handlePlaybackSpeedChange = (value) => {
    setPlaybackSpeed(value);
    savePreference('playbackSpeed', value);
  };

  const handleNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    savePreference('notifications', newValue);
  };

  const handleDeleteLectures = async () => {
    if (!window.confirm('Delete all your lectures? This will remove all uploaded lectures and their transcripts. This cannot be undone.')) {
      return;
    }
    setDeletingLectures(true);
    try {
      const lectures = await base44.entities.Lecture.list('created_date', 1000);
      let deleted = 0;
      for (const lecture of lectures) {
        try {
          await base44.functions.invoke('deleteLecture', { lecture_id: lecture.id });
          deleted++;
        } catch (err) {
          console.error(`Failed to delete lecture ${lecture.id}:`, err);
        }
      }
      toast({ title: 'Lectures deleted', description: `${deleted} lecture${deleted !== 1 ? 's' : ''} deleted successfully.` });
    } catch (err) {
      toast({ title: 'Failed to delete lectures', description: err?.message, variant: 'destructive' });
    } finally {
      setDeletingLectures(false);
    }
  };

  const handleDeleteDigests = async () => {
    if (!window.confirm('Delete all your digests? This will remove all generated digests. This cannot be undone.')) {
      return;
    }
    setDeletingDigests(true);
    try {
      const digests = await base44.entities.Digest.list('created_date', 1000);
      let deleted = 0;
      for (const digest of digests) {
        try {
          await base44.entities.Digest.delete(digest.id);
          deleted++;
        } catch (err) {
          console.error(`Failed to delete digest ${digest.id}:`, err);
        }
      }
      toast({ title: 'Digests deleted', description: `${deleted} digest${deleted !== 1 ? 's' : ''} deleted successfully.` });
    } catch (err) {
      toast({ title: 'Failed to delete digests', description: err?.message, variant: 'destructive' });
    } finally {
      setDeletingDigests(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and privacy.</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">APPEARANCE</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'light' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-2" />
              <p className="text-sm font-medium">Light</p>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'dark' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-2" />
              <p className="text-sm font-medium">Dark</p>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'system' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Monitor className="w-5 h-5 mx-auto mb-2" />
              <p className="text-sm font-medium">System</p>
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">PREFERENCES</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Default digest depth</label>
              <Select value={digestDepth} onValueChange={handleDigestDepthChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick — Brief overview, key points only</SelectItem>
                  <SelectItem value="standard">Standard — Balanced detail and brevity</SelectItem>
                  <SelectItem value="detailed">Detailed — In-depth coverage with examples</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Default playback speed</label>
              <Select value={playbackSpeed} onValueChange={handlePlaybackSpeedChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5x">0.5x — Slower</SelectItem>
                  <SelectItem value="0.75x">0.75x — Slow</SelectItem>
                  <SelectItem value="1x">1x — Normal</SelectItem>
                  <SelectItem value="1.25x">1.25x — Slightly faster</SelectItem>
                  <SelectItem value="1.5x">1.5x — Fast</SelectItem>
                  <SelectItem value="2x">2x — Very fast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Notification preferences</p>
                <p className="text-xs text-muted-foreground">Get notified when processing completes.</p>
              </div>
              <button
                onClick={handleNotificationsToggle}
                role="switch"
                aria-checked={notifications}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  notifications ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">PRIVACY & DATA</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Your lectures and digests are private to your account. We use your viewing activity only to personalize digests within this app. We do not share your data with third parties.
          </p>

          <div className="space-y-2">
            <button
              onClick={handleDeleteLectures}
              disabled={deletingLectures}
              className="w-full sm:w-auto px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingLectures ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete all lecture data
            </button>
            <button
              onClick={handleDeleteDigests}
              disabled={deletingDigests}
              className="w-full sm:w-auto px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingDigests ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete all digest history
            </button>
            <button
              onClick={() => toast({ title: 'Account deletion', description: 'Please contact support to delete your account.', variant: 'default' })}
              className="w-full sm:w-auto px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete account (contact support)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
