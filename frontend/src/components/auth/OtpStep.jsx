import React from "react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import BackButton from "@/components/BackButton";

// OTP verification step for registration. Limits incorrect attempts, offers a
// resend with cooldown, and a new code invalidates the previous one.
export default function OtpStep({
  email,
  otpCode,
  setOtpCode,
  loading,
  error,
  attemptsLeft,
  cooldown,
  blocked,
  onVerify,
  onResend,
}) {
  return (
    <AuthLayout
      icon={Mail}
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}`}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-center mb-6">
        <InputOTP
          maxLength={6}
          value={otpCode}
          onChange={setOtpCode}
          disabled={blocked}
          autoFocus
          autoComplete="one-time-code"
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        className="w-full h-12 font-medium"
        onClick={onVerify}
        disabled={loading || blocked || otpCode.length < 6}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify"
        )}
      </Button>

      {attemptsLeft > 0 && attemptsLeft <= 2 && !blocked && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground mt-4">
        {blocked ? (
          "Request a new code to continue."
        ) : cooldown > 0 ? (
          `Resend available in ${cooldown}s`
        ) : (
          <>
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={onResend}
              className="text-primary font-medium hover:underline"
            >
              Resend OTP
            </button>
          </>
        )}
      </p>
      <p className="text-center text-xs text-muted-foreground mt-2">
        The code expires after a short period. Requesting a new one invalidates the previous code.
      </p>
      <div className="mt-6">
        <BackButton to="/login" label="Back to Login" />
      </div>
    </AuthLayout>
  );
}