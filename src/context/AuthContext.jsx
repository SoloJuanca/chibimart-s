import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'chibimart_auth'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const setAuthState = (value) => {
    setAuth(value)
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const contextValue = useMemo(
    () => ({
      auth,
      setAuth: setAuthState,
    }),
    [auth],
  )

  useEffect(() => {
    if (!auth?.email) return
    let isMounted = true

    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/auth/me?email=${encodeURIComponent(auth.email)}`,
        )
        if (!response.ok) return
        const data = await response.json()
        if (!isMounted) return
        if (!data?.email) return
        setAuthState({
          id: data.id,
          email: data.email,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          phonePrefix: data.phonePrefix || null,
          verified: Boolean(data.verified),
          roles: data.roles || ['CUSTOMER'],
          isAdmin: Boolean(data.isAdmin),
        })
      } catch (error) {
        // Keep local auth state if the API is not available.
      }
    }

    fetchUser()
    return () => {
      isMounted = false
    }
  }, [auth?.email])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
