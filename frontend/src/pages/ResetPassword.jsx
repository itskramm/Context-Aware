import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrength from "@/components/PasswordStrength";
import { validatePassword } from "@/lib/authValidations";
import { isPasswordReused } from "@/lib/passwordHistory";
import BackButton from "@/components/BackButton";
import { toast } from "@/components/ui/use-toast";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const resetEmail = localStorage.getItem("pwd_reset_email") || "";
      if (resetEmail) {
        const reused = await isPasswordReused(resetEmail, newPassword);
        if (reused) {
          setError("You cannot reuse a previous password. Please choose a new password.");
          return;
        }
      }
      await base44.auth.resetPassword({ resetToken, newPassword });
      localStorage.removeItem("pwd_reset_email");
      window.location.href = "/login?reset=1";
    } catch (err) {
      setError(
        err?.message ||
          "Failed to reset password. The link may have expired — please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = <div className="mt-6"><BackButton to="/login" label="Back to Login" /></div>;

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Invalid reset link"
        subtitle="This password reset link is missing or invalid"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          The link you used appears to be incomplete. Please request a new password reset email.
        </p>
        {backToLogin}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="New password"
      subtitle="Enter your new password below"
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
              toast({
                title: "Paste disabled",
                description: "Please type your password again manually.",
              });
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
      {backToLogin}
    </AuthLayout>
  );
}