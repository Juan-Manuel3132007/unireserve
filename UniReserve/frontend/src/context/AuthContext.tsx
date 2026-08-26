/**
 * Estado global de autenticacion.
 *
 * El token se guarda en localStorage para sobrevivir a un refresco, pero la
 * fuente de verdad del usuario es siempre GET /auth/me: si el token quedo
 * invalido o expiro, la sesion se cierra sola.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { api, SESSION_EXPIRED_EVENT, tokenStorage } from '../api/client'
import type { User } from '../api/types'

interface AuthContextValue {
  user: User | null
  cargando: boolean
  esAdmin: boolean
  login: (correo: string, password: string) => Promise<User>
  register: (datos: {
    nombre: string
    apellido: string
    correo: string
    password: string
  }) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [cargando, setCargando] = useState(true)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  // Al montar: si hay token guardado, se valida contra el backend.
  useEffect(() => {
    const token = tokenStorage.get()
    if (!token) {
      setCargando(false)
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setCargando(false))
  }, [])

  // Cualquier 401 posterior cierra la sesion en toda la aplicacion.
  useEffect(() => {
    const manejar = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, manejar)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, manejar)
  }, [])

  const login = useCallback(async (correo: string, password: string) => {
    const respuesta = await api.login(correo, password)
    tokenStorage.set(respuesta.access_token)
    setUser(respuesta.user)
    return respuesta.user
  }, [])

  const register = useCallback(
    async (datos: { nombre: string; apellido: string; correo: string; password: string }) => {
      const respuesta = await api.register(datos)
      tokenStorage.set(respuesta.access_token)
      setUser(respuesta.user)
      return respuesta.user
    },
    [],
  )

  const valor = useMemo<AuthContextValue>(
    () => ({
      user,
      cargando,
      esAdmin: user?.rol === 'ADMINISTRADOR',
      login,
      register,
      logout,
    }),
    [user, cargando, login, register, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
