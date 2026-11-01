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

export default {
  saveReturnTo,
  getReturnTo,
  clearReturnTo,
  consumeReturnTo,
}
