import React, { useState } from 'react';
import { Sun, Moon, Monitor, Palette, Shield, Trash2, Loader2, Lock } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import PasswordInput from '@/components/PasswordInput';
import PasswordStrength from '@/components/PasswordStrength';
import { validatePassword } from '@/lib/authValidations';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  // Delete loading states
  const [deletingLectures, setDeletingLectures] = useState(false);
  const [deletingDigests, setDeletingDigests] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!currentPassword) {
      toast({ title: 'Validation error', description: 'Current password is required.', variant: 'destructive' });
      return;
    }
    
    if (!newPassword) {
      toast({ title: 'Validation error', description: 'New password is required.', variant: 'destructive' });
      return;
    }
    
    // Validate new password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({ title: 'Validation error', description: passwordError, variant: 'destructive' });
      return;
    }
    
    // Check passwords match
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Validation error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    
    // Check that new password is different from current
    if (currentPassword === newPassword) {
      toast({ title: 'Validation error', description: 'New password must be different from current password.', variant: 'destructive' });
      return;
    }
    
    setChangingPassword(true);
    try {
      await base44.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      toast({ 
        title: 'Password changed', 
        description: 'Your password has been updated successfully.' 
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast({ 
        title: 'Failed to change password', 
        description: err?.message || 'Please check your current password and try again.', 
        variant: 'destructive' 
      });
    } finally {
      setChangingPassword(false);
    }
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
        {/* Change Password */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">CHANGE PASSWORD</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Current Password</label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                disabled={changingPassword}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={changingPassword}
              />
              {newPassword && (
                <div className="mt-2">
                  <PasswordStrength password={newPassword} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
              <PasswordInput
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                disabled={changingPassword}
              />
            </div>

            <Button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
              className="w-full sm:w-auto"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </div>

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
