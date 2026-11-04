// Shared validation helpers for the authentication flows.

export const ACCESS_TYPES = ["User"];

// ---------- Full Name ----------
// Letters only; numbers are not allowed. Hyphens, apostrophes and spaces
// between name parts are permitted (Anne-Marie, O'Connor, Juan Dela Cruz).
export const FULL_NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ ''-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;

export function validateFullName(value) {
  const v = (value || "").trim();
  if (!v) return "Full Name is required.";
  if (!FULL_NAME_REGEX.test(v)) {
    return "Full Name must contain letters only. Numbers are not allowed (hyphens and apostrophes are permitted).";
  }
  return "";
}

// ---------- Birthday (18+, computed dynamically from the current date) ----------
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// The latest birthday that still makes the user exactly 18 today.
export function latestSelectableBirthday() {
  const now = new Date();
  return new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
}

export function validateBirthday(value) {
  if (!value) return "Birthday is required.";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Please enter a valid date.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return "Future birthdays are not selectable.";
  if (date > latestSelectableBirthday()) {
    return "You must be at least 18 years old to register.";
  }
  return "";
}

// ---------- Email ----------
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

export function validateEmail(value) {
  const v = (value || "").trim();
  if (!v) return "Email address is required.";
  if (!EMAIL_REGEX.test(v)) {
    return "Please enter a valid email address (e.g., name@example.com).";
  }
  return "";
}

// For boolean checks
export function isValidEmail(email) {
  const v = (email || "").trim();
  return EMAIL_REGEX.test(v);
}

// ---------- Philippine Mobile Number ----------
// 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (13 characters: + and 12 digits)
export const MOBILE_REGEX = /^(09\d{9}|\+639\d{9})$/;

export function validateMobile(value) {
  const v = normalizeMobile(value);
  if (!v) return "Mobile number is required.";
  if (!MOBILE_REGEX.test(v)) {
    return "Enter a valid Philippine mobile number: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX.";
  }
  return "";
}

// Keeps digits and the + sign only; everything else is stripped as typed.
export function normalizeMobile(value) {
  return (value || "").replace(/[\s-]/g, "");
}

export function cleanMobileInput(value) {
  return (value || "").replace(/[^\d+]/g, "");
}

// ---------- Password ----------
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 16;

export function checkPasswordRequirements(pwd) {
  const p = pwd || "";
  return {
    length: p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
}

export function validatePassword(pwd) {
  const c = checkPasswordRequirements(pwd);
  if (!pwd) return "Password is required.";
  if (!c.length) return `Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`;
  if (!c.upper) return "Password must include at least one uppercase letter.";
  if (!c.lower) return "Password must include at least one lowercase letter.";
  if (!c.number) return "Password must include at least one number.";
  if (!c.special) return "Password must include at least one special character.";
  return "";
}

export function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0;
}

// Calculate password strength
export function getPasswordStrength(password) {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  
  return {
    score: Math.min(score, 5),
    label: labels[Math.min(score, 5)],
    percentage: (score / 6) * 100,
  };
}

// ---------- Username ----------
export function validateUsername(username) {
  const errors = [];
  
  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }
  
  if (username.length > 20) {
    errors.push("Username must be no more than 20 characters");
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, underscores, and hyphens");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ---------- Access Type ----------
// The saved access type of an authenticated user (custom fields may be nested
// under `data`). Defaults to the least-privileged "User".
export function getAccessType(user) {
  if (!user) return "User";
  const fromData = user.data && user.data.access_type;
  return String(fromData || user.access_type || "User");
}

export default {
  ACCESS_TYPES,
  validateFullName,
  validateBirthday,
  validateEmail,
  isValidEmail,
  validateMobile,
  normalizeMobile,
  cleanMobileInput,
  validatePassword,
  checkPasswordRequirements,
  passwordsMatch,
  getPasswordStrength,
  validateUsername,
  getAccessType,
  toISODate,
  latestSelectableBirthday,
};
