import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LogIn, Mail, Loader2, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/PasswordInput";
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
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      {registered && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Account Created Successfully! Please log in with your new credentials.</span>
        </div>
      )}
      {resetDone && !registered && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Password reset successfully. Please log in with your new password.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {locked && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          Login temporarily blocked. Please try again in {mm}:{ss}.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Username / Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              disabled={locked}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 pr-11"
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
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || locked}>
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
    </AuthLayout>
  );
}