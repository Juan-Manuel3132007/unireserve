import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api, ApiError } from '../api/client'
import type { Reservation } from '../api/types'
import {
  Cargando,
  ErrorApi,
  EstadoReserva,
  fechaLegible,
  hora,
  hoyIso,
  Vacio,
} from '../components/ui'
import { useToast } from '../context/ToastContext'

export function MisReservas() {
  const toast = useToast()
  const [reservas, setReservas] = useState<Reservation[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)

  function cargar() {
    setCargando(true)
    setError(null)
    api
      .listReservations()
      .then((pagina) => setReservas(pagina.items))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  async function cancelar(id: number) {
    if (!window.confirm('Seguro que desea cancelar esta reserva?')) return
    setCancelando(id)
    try {
      const actualizada = await api.cancelReservation(id)
      setReservas((prev) => prev.map((r) => (r.id === id ? { ...r, ...actualizada } : r)))
      toast.exito('Reserva cancelada.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No fue posible cancelar la reserva.')
    } finally {
      setCancelando(null)
    }
  }

  if (cargando) return <Cargando />
  if (error) return <ErrorApi mensaje={error} onReintentar={cargar} />

  const hoy = hoyIso()

  return (
    <>
      <div className="page-head">
        <h1>Mis reservas</h1>
        <p>Historial completo de sus reservas, de la mas reciente a la mas antigua.</p>
      </div>

      {reservas.length === 0 ? (
        <Vacio
          titulo="Aun no tiene reservas"
          descripcion="Cuando reserve un espacio aparecera aqui con su fecha y franja."
          accion={
            <Link className="btn" to="/app/reservar" style={{ marginTop: '0.9rem' }}>
              Reservar un espacio
            </Link>
          }
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Espacio</th>
                <th>Fecha</th>
                <th>Franja</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => {
                const futura = r.fecha >= hoy
                const cancelable = r.estado === 'CONFIRMADA' && futura
                return (
                  <tr key={r.id}>
                    <td>{r.space?.nombre ?? `Espacio ${r.space_id}`}</td>
                    <td className="mono">{fechaLegible(r.fecha)}</td>
                    <td className="mono">
                      {hora(r.hora_inicio)}–{hora(r.hora_fin)}
                    </td>
                    <td>{r.motivo}</td>
                    <td>
                      <EstadoReserva estado={r.estado} />
                    </td>
                    <td>
                      {cancelable ? (
                        <button
                          className="btn btn--sm btn--danger"
                          disabled={cancelando === r.id}
                          onClick={() => cancelar(r.id)}
                        >
                          {cancelando === r.id ? 'Cancelando…' : 'Cancelar'}
                        </button>
                      ) : (
                        <span className="hint">
                          {r.estado === 'CANCELADA' ? '—' : 'Ya transcurrio'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
