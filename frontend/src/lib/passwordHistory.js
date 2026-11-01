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
  try {
    await base44.functions?.invoke("recordPasswordHash", { password_hash: passwordHash });
  } catch (error) {
    console.warn('Failed to record password hash:', error);
  }
}

// Returns true when the candidate password matches one previously used.
export async function isPasswordReused(email, password) {
  try {
    const candidateHash = await hashPassword(email, password);
    const res = await base44.functions?.invoke("checkPasswordReuse", {
      email,
      candidate_hash: candidateHash,
    });
    return res?.data?.reused === true;
  } catch (error) {
    console.warn('Failed to check password reuse:', error);
    return false;
  }
}

export default {
  hashPassword,
  recordPasswordHash,
  isPasswordReused,
}
