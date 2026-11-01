// Password reuse prevention. Passwords are hashed client-side with SHA-256
// (salted with the account email) and the hash — never the password itself —
// is stored in the PasswordHistory entity via backend functions.

import { base44 } from "@/api/base44Client";

export async function hashPassword(email, password) {
  const data = new TextEncoder().encode(`${String(email).toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Records the hash of a just-used password (registration or login).
// The backend takes the email from the authenticated caller.
export async function recordPasswordHash(email, password) {
  const passwordHash = await hashPassword(email, password);
  await base44.functions.invoke("recordPasswordHash", { password_hash: passwordHash });
}

// Returns true when the candidate password matches one previously used.
export async function isPasswordReused(email, password) {
  const candidateHash = await hashPassword(email, password);
  const res = await base44.functions.invoke("checkPasswordReuse", {
    email,
    candidate_hash: candidateHash,
  });
  return res?.data?.reused === true;
}/**
 * Clear password history for a user
 * @param {string} userId - User ID
 */
export function clearPasswordHistory(userId) {
  const historyData = localStorage.getItem(PASSWORD_HISTORY_KEY)
  const history = historyData ? JSON.parse(historyData) : {}
  
  if (history[userId]) {
    delete history[userId]
    localStorage.setItem(PASSWORD_HISTORY_KEY, JSON.stringify(history))
  }
}

/**
 * Record password hash (alias for addToPasswordHistory)
 * @param {string} password - Password to record
 * @param {string} userId - User ID (optional, uses 'default' if not provided)
 */
export async function recordPasswordHash(password, userId = 'default') {
  return addToPasswordHistory(userId, password)
}

export default {
  getPasswordHistory,
  addToPasswordHistory,
  isPasswordInHistory,
  clearPasswordHistory,
  recordPasswordHash,
}