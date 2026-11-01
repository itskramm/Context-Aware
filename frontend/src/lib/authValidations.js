/**
 * Authentication validation utilities
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validatePassword(password) {
  const errors = []
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate password strength
 * @param {string} password - Password to check
 * @returns {Object} Strength score and label
 */
export function getPasswordStrength(password) {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"]
  
  return {
    score: Math.min(score, 5),
    label: labels[Math.min(score, 5)],
    percentage: (score / 6) * 100,
  }
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
export function validateUsername(username) {
  const errors = []
  
  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long")
  }
  
  if (username.length > 20) {
    errors.push("Username must be no more than 20 characters")
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, underscores, and hyphens")
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if passwords match
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirmation password
 * @returns {boolean} True if passwords match
 */
export function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0
}

export default {
  isValidEmail,
  validatePassword,
  getPasswordStrength,
  validateUsername,
  passwordsMatch,
}
