/**
 * Cliente HTTP unico contra la API de UniReserve.
 *
 * Toda peticion pasa por aqui: eso concentra el manejo del token, la
 * traduccion de errores y la deteccion de sesion expirada en un solo lugar.
 */
import type {
  AuthResponse,
  Availability,
  DashboardStats,
  Page,
  Reservation,
  Space,
  User,
} from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'unireserve.token'

/** Error de API con el codigo de dominio que devuelve el backend. */
export class ApiError extends Error {
  status: number
  code?: string
  campos?: { campo: string; mensaje: string }[]

  constructor(
    message: string,
    status: number,
    code?: string,
    campos?: { campo: string; mensaje: string }[],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.campos = campos
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** Se dispara cuando el backend responde 401: la app cierra la sesion. */
export const SESSION_EXPIRED_EVENT = 'unireserve:session-expired'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(
      'No fue posible conectar con el servidor. Verifique que el backend este en ejecucion.',
      0,
      'network_error',
    )
  }

  if (response.status === 401) {
    tokenStorage.clear()
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    throw new ApiError('La sesion expiro. Inicie sesion nuevamente.', 401, 'unauthorized')
  }

  if (response.status === 204) return undefined as T

  const cuerpo = await response.json().catch(() => null)

  if (!response.ok) {
    const detalle =
      (cuerpo && typeof cuerpo.detail === 'string' && cuerpo.detail) ||
      'Ocurrio un error inesperado.'
    throw new ApiError(detalle, response.status, cuerpo?.code, cuerpo?.errores)
  }

  return cuerpo as T
}

function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') search.set(clave, String(valor))
  })
  const s = search.toString()
  return s ? `?${s}` : ''
}

export const api = {
  // --- auth ---
  register: (datos: {
    nombre: string
    apellido: string
    correo: string
    password: string
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(datos) }),

  login: (correo: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    }),

  me: () => request<User>('/auth/me'),

  // --- espacios ---
  listSpaces: (filtros: {
    tipo?: string
    estado?: string
    capacidad_min?: number
    buscar?: string
    size?: number
  } = {}) => request<Page<Space>>(`/spaces${query({ size: 100, ...filtros })}`),

  getSpace: (id: number) => request<Space>(`/spaces/${id}`),

  getAvailability: (id: number, fecha: string) =>
    request<Availability>(`/spaces/${id}/availability${query({ fecha })}`),

  createSpace: (datos: Partial<Space>) =>
    request<Space>('/spaces', { method: 'POST', body: JSON.stringify(datos) }),

  updateSpace: (id: number, datos: Partial<Space>) =>
    request<Space>(`/spaces/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),

  disableSpace: (id: number) => request<Space>(`/spaces/${id}`, { method: 'DELETE' }),

  // --- reservas ---
  listReservations: (filtros: { estado?: string; space_id?: number; size?: number } = {}) =>
    request<Page<Reservation>>(`/reservations${query({ size: 100, ...filtros })}`),

  createReservation: (datos: {
    space_id: number
    fecha: string
    hora_inicio: string
    hora_fin: string
    motivo: string
  }) => request<Reservation>('/reservations', { method: 'POST', body: JSON.stringify(datos) }),

  cancelReservation: (id: number) =>
    request<Reservation>(`/reservations/${id}`, { method: 'DELETE' }),

  // --- usuarios (solo administrador) ---
  listUsers: (filtros: { buscar?: string; rol?: string; size?: number } = {}) =>
    request<Page<User>>(`/users${query({ size: 100, ...filtros })}`),

  deactivateUser: (id: number) => request<User>(`/users/${id}`, { method: 'DELETE' }),

  // --- metricas ---
  dashboard: () => request<DashboardStats>('/stats/dashboard'),
}
