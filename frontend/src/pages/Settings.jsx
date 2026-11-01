import React, { useState } from 'react';
import { Sun, Moon, Monitor, Palette, Sliders, Shield, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('medium');

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
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
              <Select defaultValue="standard">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="quick">Quick</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Default playback speed</label>
              <Select defaultValue="1x">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5x">0.5x</SelectItem>
                  <SelectItem value="0.75x">0.75x</SelectItem>
                  <SelectItem value="1x">1x</SelectItem>
                  <SelectItem value="1.25x">1.25x</SelectItem>
                  <SelectItem value="1.5x">1.5x</SelectItem>
                  <SelectItem value="2x">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Notification preferences</p>
                <p className="text-xs text-muted-foreground">Get notified when processing completes.</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
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
            <h3 className="font-semibold">PRIVACY</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Your lectures and digests are private to your account. We use your viewing activity only to personalize digests within this app. We do not share your data with third parties.
          </p>

          <div className="space-y-2">
            <button className="w-full sm:w-auto px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete lecture data
            </button>
            <button className="w-full sm:w-auto px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete digest history
            </button>
            <button className="w-full sm:w-auto px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Account deletion (contact support)
            </button>
          </div>
        </div>

        {/* Accessibility */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">ACCESSIBILITY</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">Font size</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setFontSize('small')}
                  className={`p-3 rounded-lg border-2 text-sm transition-all ${
                    fontSize === 'small'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  Small
                </button>
                <button
                  onClick={() => setFontSize('medium')}
                  className={`p-3 rounded-lg border-2 text-sm transition-all ${
                    fontSize === 'medium'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`p-3 rounded-lg border-2 text-sm transition-all ${
                    fontSize === 'large'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  Large
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Reduced motion</p>
                <p className="text-xs text-muted-foreground">Minimize animations and transitions.</p>
              </div>
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                role="switch"
                aria-checked={reducedMotion}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  reducedMotion ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  reducedMotion ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">High contrast</p>
                <p className="text-xs text-muted-foreground">Increase contrast for better readability.</p>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                role="switch"
                aria-checked={highContrast}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  highContrast ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  highContrast ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
