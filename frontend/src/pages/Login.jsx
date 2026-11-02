import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ThemeToggle from "@/components/ThemeToggle";
import { LogIn, Mail, Loader2, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { safeReturnTo } from "@/lib/authReturnTo";
import { recordPasswordHash } from "@/lib/passwordHistory";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000;

const lockoutKey = (email) => `login_lockout:${String(email).toLowerCase()}`;
const readLockout = (email) => {
  try {
    return JSON.parse(localStorage.getItem(lockoutKey(email)) || "null");
  } catch {
    return null;
  }
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const rememberedEmail = localStorage.getItem("remembered_email") || "";
  const [email, setEmail] = useState(rememberedEmail);
  const [remember, setRemember] = useState(!!rememberedEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const returnTo = safeReturnTo();
  const urlParams = new URLSearchParams(window.location.search);
  const registered = urlParams.get("registered") === "1";
  const resetDone = urlParams.get("reset") === "1";

  // Re-check any existing lockout for the remembered email on mount.
  useEffect(() => {
    if (rememberedEmail) {
      const l = readLockout(rememberedEmail);
      if (l && l.until > Date.now()) setLockUntil(l.until);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown ticker while a lockout is active.
  useEffect(() => {
    if (!lockUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockUntil]);

  const lockRemainingSec = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const locked = lockRemainingSec > 0;
  const mm = Math.floor(lockRemainingSec / 60);
  const ss = String(lockRemainingSec % 60).padStart(2, "0");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const key = lockoutKey(email);
    const lock = readLockout(email);

    // An expired lock resets the attempt counter to a fresh start.
    if (lock && lock.until > Date.now()) {
      setLockUntil(lock.until);
      setError(
        "Too many unsuccessful login attempts. Your login has been temporarily blocked. Please try again in 5 minutes."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await base44.auth.loginViaEmailPassword(email, password);
      localStorage.removeItem(key);
      if (remember) localStorage.setItem("remembered_email", email);
      else localStorage.removeItem("remembered_email");
      
      // Record the just-used password so it can't be reused on a later reset.
      try {
        await recordPasswordHash(email, password);
      } catch (err) {
        console.error("Could not record password history", err);
      }
      
      // Update auth context
      login(response.user, response.token);
      
      // Navigate using React Router
      const destination = returnTo === "/" ? "/dashboard" : returnTo;
      navigate(destination);
    } catch (err) {
      const attempts = (lock && lock.until > Date.now() ? lock.attempts : 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        localStorage.setItem(key, JSON.stringify({ attempts, until }));
        setLockUntil(until);
        setError(
          "Too many unsuccessful login attempts. Your login has been temporarily blocked. Please try again in 5 minutes."
        );
      } else {
        localStorage.setItem(key, JSON.stringify({ attempts, until: 0 }));
        const left = MAX_ATTEMPTS - attempts;
        setError(
          `Invalid email or password. ${left} attempt${left === 1 ? "" : "s"} remaining before your login is temporarily blocked.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Product Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E3A5F] to-[#4A90E2] p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold">Context Aware</h1>
          </Link>
          <p className="mt-2 text-blue-100 text-sm">Student lecture management platform</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Study smarter,<br />not longer
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-md">
              Find the exact lecture moments you need without watching hours of recordings.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Instant transcripts</p>
                <p className="text-sm text-blue-100 mt-1">Upload lectures and get searchable transcripts in seconds</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">AI-powered summaries</p>
                <p className="text-sm text-blue-100 mt-1">Generate custom digests for exam prep or assignment research</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Topic navigation</p>
                <p className="text-sm text-blue-100 mt-1">Jump directly to relevant sections with timestamp links</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-blue-100">
          Trusted by students at universities worldwide
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Continue your study session</p>
          </div>

          {registered && (
            <div className="mb-6 p-4 rounded-lg bg-[#34D399]/10 text-[#059669] border border-[#34D399]/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Account created</p>
                <p className="text-sm mt-1">Log in with your new credentials to get started</p>
              </div>
            </div>
          )}

          {resetDone && !registered && (
            <div className="mb-6 p-4 rounded-lg bg-[#34D399]/10 text-[#059669] border border-[#34D399]/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Password reset complete</p>
                <p className="text-sm mt-1">You can now log in with your new password</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {locked && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <p className="text-sm font-medium">
                Account temporarily locked. Try again in {mm}:{ss}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  disabled={locked}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 pr-11"
                  disabled={locked}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link to="/forgot-password" className="text-sm text-[#4A90E2] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 font-medium bg-[#4A90E2] hover:bg-[#3A7BC8] text-white" 
              disabled={loading || locked}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              New to Context Aware?{" "}
              <Link
                to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
                className="text-[#4A90E2] font-medium hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}