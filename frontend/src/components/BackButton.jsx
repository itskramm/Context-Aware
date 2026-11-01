import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Reusable back button. Pass `to` for a fixed destination, or omit it to go
// back to the previous page in history.
export default function BackButton({
  to,
  label = "Back",
  variant = "outline",
  size = "sm",
  className = "",
}) {
  const navigate = useNavigate();

  if (to) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link to={to}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={() => navigate(-1)}>
      <ArrowLeft className="w-4 h-4 mr-1" />
      {label}
    </Button>
  );
}