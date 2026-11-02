import React, { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

// Data privacy notice with a required acknowledgement. The consent checkbox
// stays disabled until the user has scrolled to the bottom of the notice.
export default function DataPrivacy({ agreed, onAgreed }) {
  const [readAll, setReadAll] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight <= 8) {
      setReadAll(true);
    }
  }, []);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 8) {
      setReadAll(true);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Data Privacy Notice</p>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="text-xs text-muted-foreground space-y-2 overflow-y-auto max-h-40 pr-2 leading-relaxed"
      >
        <p>Please read this notice carefully before creating your account. You must scroll to the bottom of this notice to enable the consent checkbox.</p>
        <p><strong>Information we collect.</strong> When you create an account, we collect your full name, birthday, address, email address, mobile phone number, username, and selected access type. We also collect the account activity needed to secure and operate the system.</p>
        <p><strong>How we use your information.</strong> Your information is used to create and manage your account, verify your identity through one-time passwords, assign the correct level of access, protect your account from unauthorized use, and contact you about your account when necessary.</p>
        <p><strong>How we protect your data.</strong> Passwords are stored only as one-way hashed values and are never readable by anyone — not even administrators. Access to personal data is restricted by role-based controls enforced on the server, and sensitive actions require verification.</p>
        <p><strong>Data sharing.</strong> Your personal information is not sold or shared with third parties for marketing. It is shared only when required to operate the service or when required by law.</p>
        <p><strong>Data retention.</strong> We keep your information for as long as your account is active. You may request correction or deletion of your data at any time.</p>
        <p><strong>Your rights.</strong> You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact support.</p>
        <p>By checking the box below, you confirm that you have read and understood this Data Privacy Notice and that you consent to the collection and processing of your personal information as described above.</p>
      </div>
      {!readAll && (
        <p className="text-xs text-muted-foreground">
          Scroll to the bottom of the notice to enable the consent checkbox.
        </p>
      )}
      <div className="flex items-start gap-2">
        <Checkbox
          id="privacyConsent"
          checked={agreed}
          onCheckedChange={(v) => onAgreed(v === true)}
          disabled={!readAll}
        />
        <Label
          htmlFor="privacyConsent"
          className={`text-sm font-normal ${readAll ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
        >
          I have read and agree to the Data Privacy Notice.
        </Label>
      </div>
    </div>
  );
}