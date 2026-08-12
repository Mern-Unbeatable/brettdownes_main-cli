import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me')
      setUser(data?.user ?? null)
      return data?.user ?? null
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let active = true
    refresh().finally(() => {
      if (active) setReady(true)
    })
    return () => {
      active = false
    }
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await api.post('/api/auth/register', payload)
    // Only auto-approved accounts come back with an active session.
    if (data.autoApproved) setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      refresh,
      setUser,
    }),
    [user, ready, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
