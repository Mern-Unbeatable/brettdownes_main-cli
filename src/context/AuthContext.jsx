import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearAuthToken, setAuthToken } from '../lib/api'

const AuthContext = createContext(null)

function rememberSession(data) {
  if (data?.token) setAuthToken(data.token)
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me')
      setUser(data?.user ?? null)
      return data?.user ?? null
    } catch {
      clearAuthToken()
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
    const data = rememberSession(await api.post('/api/auth/login', { email, password }))
    setUser(data.user)
    return data.user
  }, [])

  const registerStart = useCallback(async (payload) => {
    return api.post('/api/auth/register/start', payload)
  }, [])

  const registerVerify = useCallback(async ({ email, otp }) => {
    const data = rememberSession(await api.post('/api/auth/register/verify', { email, otp }))
    if (data.autoApproved) setUser(data.user)
    return data
  }, [])

  const registerResend = useCallback(async (email) => {
    return api.post('/api/auth/register/resend', { email })
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } finally {
      clearAuthToken()
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
      registerStart,
      registerVerify,
      registerResend,
      logout,
      refresh,
      setUser,
    }),
    [user, ready, login, registerStart, registerVerify, registerResend, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
