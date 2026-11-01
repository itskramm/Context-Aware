import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { APP_PARAMS } from "./app-params"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem(APP_PARAMS.TOKEN_KEY)
    const storedUser = localStorage.getItem(APP_PARAMS.USER_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    
    setLoading(false)
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem(APP_PARAMS.TOKEN_KEY, authToken)
    localStorage.setItem(APP_PARAMS.USER_KEY, JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(APP_PARAMS.TOKEN_KEY)
    localStorage.removeItem(APP_PARAMS.USER_KEY)
    navigate("/login")
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem(APP_PARAMS.USER_KEY, JSON.stringify(userData))
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  const hasRole = (role) => {
    return user?.role === role
  }

  const isAdmin = () => {
    return hasRole(APP_PARAMS.ROLES.ADMIN)
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
    isAdmin,
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
