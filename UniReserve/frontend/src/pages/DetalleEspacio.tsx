import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { Availability, Space } from '../api/types'
import { SPACE_TYPE_LABEL } from '../api/types'
import { BandaDisponibilidad } from '../components/BandaDisponibilidad'
import { Cargando, ErrorApi, EstadoEspacio, hoyIso } from '../components/ui'

export function DetalleEspacio() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const spaceId = Number(id)

  const [espacio, setEspacio] = useState<Space | null>(null)
  const [fecha, setFecha] = useState(hoyIso())
  const [disponibilidad, setDisponibilidad] = useState<Availability | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoFranjas, setCargandoFranjas] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCargando(true)
    api
      .getSpace(spaceId)
      .then(setEspacio)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [spaceId])

  useEffect(() => {
    if (!spaceId || !fecha) return
    setCargandoFranjas(true)
    api
      .getAvailability(spaceId, fecha)
      .then(setDisponibilidad)
      .catch((e) => setError(e.message))
      .finally(() => setCargandoFranjas(false))
  }, [spaceId, fecha])

  if (cargando) return <Cargando />
  if (error && !espacio) return <ErrorApi mensaje={error} />
  if (!espacio) return null

  const habilitado = espacio.estado === 'DISPONIBLE'

  return (
    <>
      <Link to="/app/espacios" style={{ fontSize: '0.85rem' }}>
        ← Volver a espacios
      </Link>

      <div className="page-head" style={{ marginTop: '0.8rem' }}>
        <div className="space-card-head">
          <h1>{espacio.nombre}</h1>
          <EstadoEspacio estado={espacio.estado} />
        </div>
        <p>{espacio.descripcion ?? 'Este espacio no tiene descripcion registrada.'}</p>
      </div>

      <div className="grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="stat-value">{espacio.capacidad}</div>
          <div className="stat-label">Capacidad</div>
        </div>
        <div className="card">
          <h3>{SPACE_TYPE_LABEL[espacio.tipo]}</h3>
          <div className="stat-label">Tipo de espacio</div>
        </div>
        <div className="card">
          <h3>{espacio.ubicacion}</h3>
          <div className="stat-label">Ubicacion</div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <h2>Jornada del dia</h2>
          <div style={{ maxWidth: 190 }}>
            <label htmlFor="fecha-disponibilidad">Fecha</label>
            <input
              id="fecha-disponibilidad"
              type="date"
              value={fecha}
              min={hoyIso()}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        {cargandoFranjas ? (
          <Cargando texto="Consultando disponibilidad…" />
        ) : (
          <>
            <BandaDisponibilidad ocupado={disponibilidad?.ocupado ?? []} />

            {disponibilidad && disponibilidad.ocupado.length > 0 ? (
              <ul style={{ paddingLeft: '1.1rem', color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
                {disponibilidad.ocupado.map((slot) => (
                  <li key={slot.reservation_id}>
                    Reservado de <span className="mono">{slot.hora_inicio}</span> a{' '}
                    <span className="mono">{slot.hora_fin}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
                La jornada completa esta libre para esta fecha.
              </p>
            )}
          </>
        )}

        {habilitado ? (
          <button
            className="btn"
            style={{ marginTop: '0.6rem' }}
            onClick={() => navigate(`/app/reservar?space=${espacio.id}&fecha=${fecha}`)}
          >
            Reservar este espacio
          </button>
        ) : (
          <div className="alert alert--info" style={{ marginTop: '0.8rem' }}>
            Este espacio no admite reservas mientras su estado sea{' '}
            {espacio.estado === 'MANTENIMIENTO' ? 'en mantenimiento' : 'deshabilitado'}.
          </div>
        )}
      </div>
    </>
  )
}
