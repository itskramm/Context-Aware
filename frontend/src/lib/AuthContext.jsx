import { createContext, useContext, useState, useEffect } from "react"
import { APP_PARAMS } from "./app-params"
import { base44 } from "@/api/base44Client"

const AuthContext = createContext(null)

const SESSION_TIMEOUT_MS = 60000 // 1 minute

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem(APP_PARAMS.TOKEN_KEY || 'auth_token')
    const storedUser = localStorage.getItem(APP_PARAMS.USER_KEY || 'user')
    const lastActivity = localStorage.getItem('lastActivity')

    if (storedToken && storedUser && lastActivity) {
      const lastActivityTime = parseInt(lastActivity, 10)
      const now = Date.now()
      const timeSinceActivity = now - lastActivityTime

      // Check if session expired (more than 1 minute since last activity)
      if (timeSinceActivity > SESSION_TIMEOUT_MS) {
        // Session expired, clear everything
        localStorage.removeItem(APP_PARAMS.TOKEN_KEY || 'auth_token')
        localStorage.removeItem(APP_PARAMS.USER_KEY || 'user')
        localStorage.removeItem('lastActivity')
        localStorage.removeItem('token')
        localStorage.removeItem('base44_access_token')
        setLoading(false)
        setAuthChecked(true)
        return
      }

      // Session still valid, restore it
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        // Keep the existing lastActivity timestamp - don't reset it
        // It will be updated by InactivityLogout when user actually interacts
      } catch (err) {
        console.error('Failed to parse stored user:', err)
      }
    }
    
    setLoading(false)
    setAuthChecked(true)
  }, [])

  const checkUserAuth = async () => {
    if (authChecked) return;
    setAuthChecked(true);
  }

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem(APP_PARAMS.TOKEN_KEY || 'auth_token', authToken)
    localStorage.setItem(APP_PARAMS.USER_KEY || 'user', JSON.stringify(userData))
    localStorage.setItem('lastActivity', Date.now().toString())
    setAuthError(null)
  }

  const updateLastActivity = () => {
    if (token && user) {
      localStorage.setItem('lastActivity', Date.now().toString())
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(APP_PARAMS.TOKEN_KEY || 'auth_token')
    localStorage.removeItem(APP_PARAMS.USER_KEY || 'user')
    localStorage.removeItem('lastActivity')
    localStorage.removeItem('token')
    localStorage.removeItem('base44_access_token')
    // Component calling logout should handle navigation
    window.location.href = '/login'
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem(APP_PARAMS.USER_KEY || 'user', JSON.stringify(userData))
  }

  const refreshUser = async () => {
    try {
      const response = await base44.auth.me()
      if (response) {
        setUser(response)
        localStorage.setItem(APP_PARAMS.USER_KEY || 'user', JSON.stringify(response))
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      throw error
    }
  }

  const isAuthenticated = !!token && !!user

  const hasRole = (role) => {
    return user?.role === role
  }

  const isAdmin = () => {
    return false
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    authChecked,
    authError,
    checkUserAuth,
    login,
    logout,
    updateUser,
    refreshUser,
    updateLastActivity,
    hasRole,
    isAdmin,
    // Compatibility properties for components expecting these
    isLoadingAuth: loading,
    isLoadingPublicSettings: false,
    navigateToLogin: () => { window.location.href = '/login' },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext
