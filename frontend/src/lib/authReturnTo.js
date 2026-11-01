/**
 * Utility for managing redirect after authentication
 */

const RETURN_TO_KEY = "auth_return_to"

/**
 * Save the current path to return to after authentication
 * @param {string} path - Path to return to
 */
export function saveReturnTo(path) {
  if (path && path !== "/login" && path !== "/register") {
    sessionStorage.setItem(RETURN_TO_KEY, path)
  }
}

/**
 * Get the saved return path
 * @returns {string|null} Saved path or null
 */
export function getReturnTo() {
  return sessionStorage.getItem(RETURN_TO_KEY)
}

/**
 * Clear the saved return path
 */
export function clearReturnTo() {
  sessionStorage.removeItem(RETURN_TO_KEY)
}

/**
 * Get and clear the return path in one operation
 * @param {string} defaultPath - Default path if no return path is saved
 * @returns {string} Path to return to
 */
export function consumeReturnTo(defaultPath = "/dashboard") {
  const returnTo = getReturnTo() || defaultPath
  clearReturnTo()
  return returnTo
}

/**
 * Resolve ?returnTo= to a safe same-origin path, else default.
 * Prevents open redirect vulnerabilities.
 * @returns {string} Safe path to redirect to
 */
export function safeReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    // Strip auth-bootstrap params
    for (const p of ["access_token", "clear_access_token", "app_id", "app_base_url", "functions_version", "from_url"]) {
      url.searchParams.delete(p);
    }
    const path = url.pathname + url.search;
    // Ensure path is safe: starts with / but not // or contains \
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}

export default {
  saveReturnTo,
  getReturnTo,
  clearReturnTo,
  consumeReturnTo,
  safeReturnTo,
}
