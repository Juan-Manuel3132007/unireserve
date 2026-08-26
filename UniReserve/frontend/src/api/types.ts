/** Tipos que reflejan los schemas Pydantic del backend. */

export type UserRole = 'ESTUDIANTE' | 'ADMINISTRADOR'
export type SpaceType =
  | 'SALA_ESTUDIO'
  | 'LABORATORIO'
  | 'SALA_REUNIONES'
  | 'AUDITORIO'
  | 'AULA'
export type SpaceStatus = 'DISPONIBLE' | 'DESHABILITADO' | 'MANTENIMIENTO'
export type ReservationStatus = 'CONFIRMADA' | 'CANCELADA'

export interface User {
  id: number
  nombre: string
  apellido: string
  correo: string
  rol: UserRole
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Space {
  id: number
  nombre: string
  descripcion: string | null
  ubicacion: string
  capacidad: number
  tipo: SpaceType
  estado: SpaceStatus
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: number
  user_id: number
  space_id: number
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: ReservationStatus
  motivo: string
  created_at: string
  updated_at: string
  user?: { id: number; nombre: string; apellido: string; correo: string } | null
  space?: { id: number; nombre: string; ubicacion: string } | null
}

export interface OccupiedSlot {
  reservation_id: number
  hora_inicio: string
  hora_fin: string
}

export interface Availability {
  space_id: number
  fecha: string
  espacio_habilitado: boolean
  ocupado: OccupiedSlot[]
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface DashboardStats {
  rol: UserRole
  total_usuarios?: number
  usuarios_activos?: number
  total_espacios?: number
  espacios_disponibles: number
  total_reservas: number
  reservas_confirmadas: number
  reservas_hoy?: number
  reservas_proximas?: number
}

export const SPACE_TYPE_LABEL: Record<SpaceType, string> = {
  SALA_ESTUDIO: 'Sala de estudio',
  LABORATORIO: 'Laboratorio',
  SALA_REUNIONES: 'Sala de reuniones',
  AUDITORIO: 'Auditorio',
  AULA: 'Aula',
}

export const SPACE_STATUS_LABEL: Record<SpaceStatus, string> = {
  DISPONIBLE: 'Disponible',
  DESHABILITADO: 'Deshabilitado',
  MANTENIMIENTO: 'En mantenimiento',
}
