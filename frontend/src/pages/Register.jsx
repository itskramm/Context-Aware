import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Loader2, MapPin, Phone, Calendar, User as UserIcon } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrength from "@/components/PasswordStrength";
import DataPrivacy from "@/components/DataPrivacy";
import OtpStep from "@/components/auth/OtpStep";
import { toast } from "@/components/ui/use-toast";
import {
  validateFullName,
  validateBirthday,
  validateEmail,
  validateMobile,
  cleanMobileInput,
  normalizeMobile,
  validatePassword,
  toISODate,
  latestSelectableBirthday,
  ACCESS_TYPES,
} from "@/lib/authValidations";
import { recordPasswordHash } from "@/lib/passwordHistory";
import { safeReturnTo } from "@/lib/authReturnTo";
import { sendOtp, verifyOtp } from "@/lib/emailService";

const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN = 60;

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [accessType, setAccessType] = useState("User");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpBlocked, setOtpBlocked] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const maxBirthday = toISODate(latestSelectableBirthday());

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setErr = (field, msg) => setErrors((prev) => ({ ...prev, [field]: msg }));

  const onFullNameChange = (e) => {
    const v = e.target.value;
    setFullName(v);
    setErr("fullName", v ? validateFullName(v) : "");
  };

  const onBirthdayChange = (e) => {
    const v = e.target.value;
    setBirthday(v);
    setErr("birthday", v ? validateBirthday(v) : "");
  };

  const onEmailChange = (e) => {
    const v = e.target.value;
    setEmail(v);
    setErr("email", v ? validateEmail(v) : "");
  };

  const onMobileChange = (e) => {
    const v = cleanMobileInput(e.target.value);
    setMobile(v);
    setErr("mobile", v ? validateMobile(v) : "");
  };

  const onPasswordChange = (v) => {
    setPassword(v);
    setErrors((prev) => ({
      ...prev,
      password: v ? validatePassword(v) : "",
      confirmPassword: v && confirmPassword && v !== confirmPassword ? "Passwords do not match." : "",
    }));
  };

  const onConfirmChange = (v) => {
    setConfirmPassword(v);
    setErr("confirmPassword", v && v !== password ? "Passwords do not match." : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");

    const errs = {
      fullName: validateFullName(fullName),
      birthday: validateBirthday(birthday),
      address: address.trim() ? "" : "Address is required.",
      email: validateEmail(email),
      mobile: validateMobile(mobile),
      accessType: ACCESS_TYPES.includes(accessType) ? "" : "Please select an access type.",
      password: validatePassword(password),
      confirmPassword: password === confirmPassword ? "" : "Passwords do not match.",
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    if (!privacyAgreed) return;

    setLoading(true);
    try {
      // First create the account, then send OTP for email verification
      await base44.auth.register({ email, password, name: fullName.trim() });
      await sendOtp(email, fullName.trim(), "register");
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err?.message || "";
      if (/already|exist|registered|duplicate|taken/i.test(msg)) {
        setGlobalError(
          "Email already registered. Please use a different email address or reset your password."
        );
      } else {
        setGlobalError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setGlobalError("");
    const err = verifyOtp(email, otpCode);
    if (err) {
      const attempts = otpAttempts + 1;
      setOtpAttempts(attempts);
      const left = MAX_OTP_ATTEMPTS - attempts;
      if (left <= 0) {
        setOtpBlocked(true);
        setGlobalError("Too many incorrect attempts. Please request a new code.");
      } else {
        setGlobalError(`${err} ${left} attempt${left === 1 ? "" : "s"} remaining.`);
      }
      setOtpCode("");
      return;
    }

    // OTP verified — save profile details then redirect to login
    setLoading(true);
    try {
      await base44.auth.updateMe({
        name: fullName.trim(),
        birthday,
        address: address.trim(),
        mobile_number: normalizeMobile(mobile),
        username: email,
        access_type: accessType,
      });
      await recordPasswordHash(email, password);
    } catch (profileErr) {
      console.error("Could not save profile details", profileErr);
    } finally {
      setLoading(false);
    }

    window.location.href = "/login?registered=1";
  };

  const handleResend = async () => {
    setGlobalError("");
    setLoading(true);
    try {
      await sendOtp(email, fullName.trim(), "register");
      setOtpAttempts(0);
      setOtpBlocked(false);
      setOtpCode("");
      setCooldown(RESEND_COOLDOWN);
      toast({
        title: "New code sent",
        description: "A new OTP was sent to your email. The previous code is no longer valid.",
      });
    } catch (err) {
      setGlobalError(err?.message || "Failed to resend the code. Please try again.");
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
        error={globalError}
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
      className="py-12"
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-medium hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      {globalError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="fullName"
                value={fullName}
                onChange={onFullNameChange}
                placeholder="Juan Dela Cruz"
                className="pl-10 h-12"
                required
              />
            </div>
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>

          {/* Birthday */}
          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                id="birthday"
                type="date"
                value={birthday}
                min="1900-01-01"
                max={maxBirthday}
                onChange={onBirthdayChange}
                className="pl-10 h-12"
                required
              />
            </div>
            {errors.birthday && <p className="text-xs text-destructive">{errors.birthday}</p>}
            <p className="text-xs text-muted-foreground">You must be at least 18 years old.</p>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setErr("address", e.target.value.trim() ? "" : "Address is required.");
              }}
              placeholder="House no., Street, City, Province"
              className="pl-10 h-12"
              required
            />
          </div>
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={onEmailChange}
                placeholder="you@example.com"
                className="pl-10 h-12"
                required
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Username (mirrors email) */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="username"
                value={email}
                readOnly
                placeholder="Your username is your email address"
                className="pl-10 h-12 bg-muted/60"
              />
            </div>
            <p className="text-xs text-muted-foreground">Your username is your email address.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Mobile */}
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="mobile"
                inputMode="tel"
                value={mobile}
                onChange={onMobileChange}
                placeholder="09171234567 or +639171234567"
                className="pl-10 h-12"
                required
              />
            </div>
            {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
            <p className="text-xs text-muted-foreground">Philippine numbers only: 09XXXXXXXXX or +639XXXXXXXXX.</p>
          </div>

          {/* Access Type */}
          <div className="space-y-2">
            <Label htmlFor="accessType">Access Type</Label>
            <Select
              value={accessType}
              onValueChange={(v) => {
                setAccessType(v);
                setErr("accessType", "");
              }}
            >
              <SelectTrigger id="accessType" className="h-12">
                <SelectValue placeholder="Select access type" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accessType && <p className="text-xs text-destructive">{errors.accessType}</p>}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={onPasswordChange}
            autoComplete="new-password"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={onConfirmChange}
            autoComplete="new-password"
            onPaste={(e) => {
              e.preventDefault();
              toast({
                title: "Paste disabled",
                description: "Please type your password again manually.",
              });
            }}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Copy/paste is disabled — please type the password again.
          </p>
        </div>

        <DataPrivacy agreed={privacyAgreed} onAgreed={setPrivacyAgreed} />

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !privacyAgreed}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}