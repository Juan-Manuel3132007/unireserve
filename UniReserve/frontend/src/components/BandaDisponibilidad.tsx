/**
 * Banda de disponibilidad: la jornada 6:00–22:00 dibujada a escala.
 *
 * Es el elemento central de la interfaz — muestra de un vistazo que franjas
 * estan ocupadas sin obligar al usuario a leer una lista de horas.
 */
import type { OccupiedSlot } from '../api/types'

const APERTURA = 6 * 60
const CIERRE = 22 * 60
const JORNADA = CIERRE - APERTURA

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function BandaDisponibilidad({ ocupado }: { ocupado: OccupiedSlot[] }) {
  return (
    <div className="timeline">
      <div
        className="timeline-track"
        role="img"
        aria-label={
          ocupado.length === 0
            ? 'Jornada completamente libre entre 6:00 y 22:00'
            : `Franjas ocupadas: ${ocupado.map((o) => `${o.hora_inicio} a ${o.hora_fin}`).join(', ')}`
        }
      >
        {ocupado.map((slot) => {
          const inicio = Math.max(aMinutos(slot.hora_inicio), APERTURA)
          const fin = Math.min(aMinutos(slot.hora_fin), CIERRE)
          const left = ((inicio - APERTURA) / JORNADA) * 100
          const width = ((fin - inicio) / JORNADA) * 100
          if (width <= 0) return null
          return (
            <div
              key={slot.reservation_id}
              className="timeline-block"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`Ocupado ${slot.hora_inicio}–${slot.hora_fin}`}
            />
          )
        })}
      </div>
      <div className="timeline-hours" aria-hidden="true">
        <span>06:00</span>
        <span>10:00</span>
        <span>14:00</span>
        <span>18:00</span>
        <span>22:00</span>
      </div>
      <div className="timeline-legend">
        <span>
          <span className="legend-swatch" style={{ background: 'var(--free-wash)', border: '1px solid var(--line)' }} />
          Libre
        </span>
        <span>
          <span className="legend-swatch" style={{ background: 'var(--busy)' }} />
          Reservado
        </span>
      </div>
    </div>
  )
}
