import React from "react";
import { Check, X } from "lucide-react";
import { checkPasswordRequirements, getPasswordStrength } from "@/lib/authValidations";

const REQUIREMENT_LABELS = {
  length: "Minimum 8 characters (8–16)",
  upper: "Uppercase letter",
  lower: "Lowercase letter",
  number: "Number",
  special: "Special character",
};

// Live password strength indicator + per-requirement checklist.
// The bar turns fully green only when every requirement is satisfied.
export default function PasswordStrength({ password = "" }) {
  const checks = checkPasswordRequirements(password);
  const metCount = Object.values(checks).filter(Boolean).length;
  const strength = getPasswordStrength(password);
  
  // Map score to level
  let level = "weak";
  if (strength.score >= 5) level = "strong";
  else if (strength.score >= 3) level = "average";
  
  const levelLabel = level === "strong" ? "Strong" : level === "average" ? "Average" : "Weak";
  const barColor =
    level === "strong"
      ? "bg-green-500"
      : level === "average"
        ? "bg-yellow-500"
        : "bg-red-500";
  const textColor =
    level === "strong"
      ? "text-green-600 dark:text-green-400"
      : level === "average"
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4, 5].map((seg) => (
            <div
              key={seg}
              className={`h-1.5 flex-1 rounded-full transition-colors ${seg <= metCount ? barColor : "bg-border"}`}
            />
          ))}
        </div>
        <span className={`text-xs font-semibold ${textColor}`}>{levelLabel}</span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {Object.entries(REQUIREMENT_LABELS).map(([key, label]) => (
          <li
            key={key}
            className={`flex items-center gap-1.5 text-xs ${
              checks[key]
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {checks[key] ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0" />
            )}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}