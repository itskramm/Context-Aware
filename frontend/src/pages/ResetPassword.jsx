import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrength from "@/components/PasswordStrength";
import { validatePassword } from "@/lib/authValidations";
import { isPasswordReused, recordPasswordHash } from "@/lib/passwordHistory";
import BackButton from "@/components/BackButton";
import { toast } from "@/components/ui/use-toast";

export default function ResetPassword() {
  // Email is set in sessionStorage by ForgotPassword after OTP is verified.
  const verifiedEmail = sessionStorage.getItem("pwd_reset_verified_email") || "";

  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const pwErr = validatePassword(newPassword);
    if (pwErr) { setError(pwErr); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      if (verifiedEmail) {
        const reused = await isPasswordReused(verifiedEmail, newPassword);
        if (reused) {
          setError("You cannot reuse a previous password. Please choose a new password.");
          return;
        }
      }

      // Update the password via the backend
      await base44.auth.resetPassword({ email: verifiedEmail, newPassword });

      // Record new password hash for future reuse checks
      if (verifiedEmail) {
        await recordPasswordHash(verifiedEmail, newPassword).catch(() => {});
      }

      // Clean up
      sessionStorage.removeItem("pwd_reset_verified_email");
      localStorage.removeItem("pwd_reset_email");

      navigate("/login?reset=1");
    } catch (err) {
      setError(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Guard: if no verified email the user hasn't gone through OTP
  if (!verifiedEmail) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Verification required"
        subtitle="You need to verify your email before resetting your password"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a verification code
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          Please use the Forgot Password flow to receive a code, then come back here.
        </p>
        <div className="mt-6">
          <BackButton to="/forgot-password" label="Go to Forgot Password" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="New password"
      subtitle={`Setting a new password for ${verifiedEmail}`}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordInput
            id="newPassword"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            autoFocus
          />
          <PasswordStrength password={newPassword} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            onPaste={(e) => {
              e.preventDefault();
              toast({ title: "Paste disabled", description: "Please type your password again manually." });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Copy/paste is disabled — please type the password again.
          </p>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
      <div className="mt-6">
        <BackButton to="/login" label="Back to Login" />
      </div>
    </AuthLayout>
  );
}
