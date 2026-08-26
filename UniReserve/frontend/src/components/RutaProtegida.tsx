/**
 * Guarda de rutas del frontend.
 *
 * Es solo una capa de experiencia de usuario: la autorizacion real la aplica
 * el backend en cada endpoint. Ocultar una ruta aqui no protege nada por si
 * solo, y por eso los tests del backend cubren los 403.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Cargando } from './ui'
import { useAuth } from '../context/AuthContext'

export function RutaProtegida({ soloAdmin = false }: { soloAdmin?: boolean }) {
  const { user, cargando, esAdmin } = useAuth()
  const location = useLocation()

  if (cargando) return <Cargando texto="Verificando la sesion…" />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (soloAdmin && !esAdmin) return <Navigate to="/app" replace />

  return <Outlet />
}
