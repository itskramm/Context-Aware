/**
 * EmailJS-based OTP service.
 * Sends OTP codes for account verification and password reset.
 * OTP state (code + expiry) is kept in sessionStorage so it survives
 * a page reload but is cleared when the tab closes.
 */
import emailjs from '@emailjs/browser';

const SERVICE_ID   = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const OTP_TEMPLATE = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
const RST_TEMPLATE = import.meta.env.VITE_EMAILJS_RESET_TEMPLATE_ID;
const PUBLIC_KEY   = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_STORE_KEY = 'ca_otp_session';

// ---------- helpers ----------

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function saveOtp(email, code) {
  const record = { email, code, expiresAt: Date.now() + OTP_TTL_MS };
  sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(record));
}

function loadOtp() {
  try {
    return JSON.parse(sessionStorage.getItem(OTP_STORE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function clearOtp() {
  sessionStorage.removeItem(OTP_STORE_KEY);
}

// ---------- public API ----------

/**
 * Generate an OTP, save it locally, and email it to the user.
 * @param {string} email   Recipient email
 * @param {string} name    Recipient display name (or the email itself)
 * @param {'register'|'reset'} purpose  Which flow triggered the OTP
 */
export async function sendOtp(email, name, purpose = 'register') {
  const code = generateOtp();
  saveOtp(email, code);

  const templateId = purpose === 'reset' ? RST_TEMPLATE : OTP_TEMPLATE;
  const purposeLabel = purpose === 'reset' ? 'Password reset' : 'Account verification';

  await emailjs.send(
    SERVICE_ID,
    templateId,
    {
      to_email:    email,
      to_name:     name || email,
      otp_code:    code,
      otp_purpose: purposeLabel,
    },
    PUBLIC_KEY,
  );
}

/**
 * Verify a code the user entered against the stored OTP.
 * Returns null on success, or an error string on failure.
 */
export function verifyOtp(email, enteredCode) {
  const record = loadOtp();

  if (!record) return 'No verification code found. Please request a new one.';
  if (record.email !== email) return 'Email mismatch. Please request a new code.';
  if (Date.now() > record.expiresAt) {
    clearOtp();
    return 'Your code has expired. Please request a new one.';
  }
  if (record.code !== String(enteredCode).trim()) {
    return 'Incorrect code.';
  }

  // Valid — clear it so it can't be reused
  clearOtp();
  return null;
}
