/** Piezas de interfaz reutilizables: carga, vacio, error y etiquetas de estado. */
import type { ReactNode } from 'react'

import type { ReservationStatus, SpaceStatus } from '../api/types'
import { SPACE_STATUS_LABEL } from '../api/types'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="loading-block">
      <span className="spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  )
}

export function Vacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion: string
  accion?: ReactNode
}) {
  return (
    <div className="empty">
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
      {accion}
    </div>
  )
}

export function ErrorApi({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="alert alert--error" role="alert">
      {mensaje}
      {onReintentar && (
        <>
          {' '}
          <button className="btn btn--sm btn--ghost" onClick={onReintentar} style={{ marginLeft: 8 }}>
            Reintentar
          </button>
        </>
      )}
    </div>
  )
}

export function EstadoEspacio({ estado }: { estado: SpaceStatus }) {
  const clase =
    estado === 'DISPONIBLE' ? 'badge--ok' : estado === 'MANTENIMIENTO' ? 'badge--warn' : 'badge--off'
  return <span className={`badge ${clase}`}>{SPACE_STATUS_LABEL[estado]}</span>
}

export function EstadoReserva({ estado }: { estado: ReservationStatus }) {
  return (
    <span className={`badge ${estado === 'CONFIRMADA' ? 'badge--ok' : 'badge--off'}`}>
      {estado === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada'}
    </span>
  )
}

/** Recorta "09:00:00" a "09:00": la API devuelve segundos que aqui sobran. */
export function hora(valor: string): string {
  return valor.slice(0, 5)
}

export function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function hoyIso(): string {
  const ahora = new Date()
  const offset = ahora.getTimezoneOffset() * 60000
  return new Date(ahora.getTime() - offset).toISOString().slice(0, 10)
}
