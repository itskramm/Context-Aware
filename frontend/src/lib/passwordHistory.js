/**
 * Password history management utilities
 */

const PASSWORD_HISTORY_KEY = "password_history"
const MAX_HISTORY_SIZE = 5

/**
 * Hash a password (simple client-side hashing for history comparison)
 * Note: This is NOT for security, just for checking if password was used before
 * @param {string} password - Password to hash
 * @returns {Promise<string>} Hashed password
 */
async function simpleHash(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Get password history for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of hashed passwords
 */
export function getPasswordHistory(userId) {
  const historyData = localStorage.getItem(PASSWORD_HISTORY_KEY)
  const history = historyData ? JSON.parse(historyData) : {}
  return history[userId] || []
}

/**
 * Add password to history
 * @param {string} userId - User ID
 * @param {string} password - Password to add
 */
export async function addToPasswordHistory(userId, password) {
  const hashedPassword = await simpleHash(password)
  const historyData = localStorage.getItem(PASSWORD_HISTORY_KEY)
  const history = historyData ? JSON.parse(historyData) : {}
  
  if (!history[userId]) {
    history[userId] = []
  }
  
  // Add new password to beginning of array
  history[userId].unshift(hashedPassword)
  
  // Keep only the last N passwords
  history[userId] = history[userId].slice(0, MAX_HISTORY_SIZE)
  
  localStorage.setItem(PASSWORD_HISTORY_KEY, JSON.stringify(history))
}

/**
 * Check if password was used recently
 * @param {string} userId - User ID
 * @param {string} password - Password to check
 * @returns {Promise<boolean>} True if password was used before
 */
export async function isPasswordInHistory(userId, password) {
  const hashedPassword = await simpleHash(password)
  const userHistory = getPasswordHistory(userId)
  return userHistory.includes(hashedPassword)
}

/**
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

export default {
  getPasswordHistory,
  addToPasswordHistory,
  isPasswordInHistory,
  clearPasswordHistory,
}
