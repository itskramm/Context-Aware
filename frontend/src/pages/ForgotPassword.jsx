import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import OtpStep from "@/components/auth/OtpStep";
import { sendOtp, verifyOtp } from "@/lib/emailService";
import { toast } from "@/components/ui/use-toast";
import { validateEmail } from "@/lib/authValidations";

const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN = 60;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [otpCode, setOtpCode] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpBlocked, setOtpBlocked] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Step 1 — collect email and send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError("");
    setLoading(true);
    try {
      // Check the account exists before sending (fire-and-forget ok if it fails —
      // we still proceed to avoid leaking whether an email is registered)
      await sendOtp(email, email, "reset");
      localStorage.setItem("pwd_reset_email", email);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast({
        title: "Could not send code",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerify = () => {
    setOtpError("");
    const err = verifyOtp(email, otpCode);
    if (err) {
      const attempts = otpAttempts + 1;
      setOtpAttempts(attempts);
      const left = MAX_OTP_ATTEMPTS - attempts;
      if (left <= 0) {
        setOtpBlocked(true);
        setOtpError("Too many incorrect attempts. Please request a new code.");
      } else {
        setOtpError(`${err} ${left} attempt${left === 1 ? "" : "s"} remaining.`);
      }
      setOtpCode("");
      return;
    }
    // OTP correct — mark email as verified and go to reset page
    sessionStorage.setItem("pwd_reset_verified_email", email);
    navigate("/reset-password");
  };

  // Resend OTP
  const handleResend = async () => {
    setOtpError("");
    setLoading(true);
    try {
      await sendOtp(email, email, "reset");
      setOtpAttempts(0);
      setOtpBlocked(false);
      setOtpCode("");
      setCooldown(RESEND_COOLDOWN);
      toast({ title: "New code sent", description: "Check your email for the new code." });
    } catch (err) {
      setOtpError(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <OtpStep
        email={email}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        loading={loading}
        error={otpError}
        attemptsLeft={MAX_OTP_ATTEMPTS - otpAttempts}
        cooldown={cooldown}
        blocked={otpBlocked}
        onVerify={handleVerify}
        onResend={handleResend}
      />
    );
  }

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="Enter your email to receive a verification code"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              className="pl-10 h-12"
              required
            />
          </div>
          {emailError && <p className="text-xs text-destructive">{emailError}</p>}
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending code...
            </>
          ) : (
            "Send verification code"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
