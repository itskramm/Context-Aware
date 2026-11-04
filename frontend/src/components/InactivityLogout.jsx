import React, { useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";

const INACTIVITY_LIMIT_MS = 60000; // 1 minute of inactivity
const WARNING_AT_MS = 50000; // warn 10 seconds before logout

// Automatically logs the user out after 30 minutes without meaningful
// interaction (clicks, key presses, scrolling, touches). Shows a warning
// toast shortly before the session expires.
export default function InactivityLogout() {
  const { logout, updateLastActivity } = useAuth();
  const warnedRef = useRef(false);

  useEffect(() => {
    let logoutTimer;
    let warnTimer;

    const schedule = () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
      warnedRef.current = false;
      
      // Update lastActivity timestamp in localStorage
      updateLastActivity();
      
      warnTimer = setTimeout(() => {
        if (!warnedRef.current) {
          warnedRef.current = true;
          toast({
            title: "Session expiring",
            description: "Your session will expire soon due to inactivity.",
          });
        }
      }, WARNING_AT_MS);
      logoutTimer = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT_MS);
    };

    const events = ["click", "keydown", "scroll", "touchstart"];
    events.forEach((e) => document.addEventListener(e, schedule, { passive: true }));
    schedule();

    return () => {
      events.forEach((e) => document.removeEventListener(e, schedule));
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
    };
  }, [logout, updateLastActivity]);

  return null;
}