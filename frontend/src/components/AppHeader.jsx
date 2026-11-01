import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { getAccessType } from "@/lib/authValidations";

const BADGE_STYLES = {
  "Super Admin": "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  Admin: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  User: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

// App header: shows the signed-in user's access type (top-left, read-only)
// plus Reset Password, theme toggle and Logout.
export default function AppHeader() {
  const { user } = useAuth();
  const accessType = getAccessType(user);
  const email = user?.email || "";

  const handleResetPassword = async () => {
    try {
      localStorage.setItem("pwd_reset_email", email);
      await base44.auth.resetPasswordRequest(email);
      toast({
        title: "Reset link sent",
        description: `A password reset link was sent to ${email}. Open it to set a new password.`,
      });
    } catch (err) {
      toast({
        title: "Could not send the reset link",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm text-muted-foreground hidden sm:inline shrink-0">Access Type:</span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold truncate ${BADGE_STYLES[accessType] || BADGE_STYLES.User}`}
          >
            {accessType}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleResetPassword}>
            <KeyRound className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Reset Password</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => base44.auth.logout("/login")}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}