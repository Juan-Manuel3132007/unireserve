import { useEffect, useState } from 'react'

import { api, ApiError } from '../api/client'
import type { Reservation } from '../api/types'
import { Cargando, ErrorApi, EstadoReserva, fechaLegible, hora, Vacio } from '../components/ui'
import { useToast } from '../context/ToastContext'

export function AdminReservas() {
  const toast = useToast()
  const [reservas, setReservas] = useState<Reservation[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')

  function cargar() {
    setCargando(true)
    setError(null)
    api
      .listReservations(filtroEstado ? { estado: filtroEstado } : {})
      .then((pagina) => setReservas(pagina.items))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [filtroEstado])

  async function cancelar(reserva: Reservation) {
    if (!window.confirm('Cancelar esta reserva? El usuario perdera la franja.')) return
    try {
      const actualizada = await api.cancelReservation(reserva.id)
      setReservas((prev) => prev.map((r) => (r.id === reserva.id ? { ...r, ...actualizada } : r)))
      toast.exito('Reserva cancelada.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No fue posible cancelar la reserva.')
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Todas las reservas</h1>
        <p>Calendario completo del campus, con el usuario responsable de cada franja.</p>
      </div>

      <div className="filters">
        <div>
          <label htmlFor="filtro-estado">Estado</label>
          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="CONFIRMADA">Confirmadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
      </div>

      {cargando && <Cargando />}
      {error && <ErrorApi mensaje={error} onReintentar={cargar} />}

      {!cargando && !error && reservas.length === 0 && (
        <Vacio
          titulo="No hay reservas para este filtro"
          descripcion="Cambie el estado seleccionado para ver otras reservas."
        />
      )}

      {!cargando && !error && reservas.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Espacio</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Franja</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr key={r.id}>
                  <td>{r.space?.nombre ?? `Espacio ${r.space_id}`}</td>
                  <td>
                    {r.user ? `${r.user.nombre} ${r.user.apellido}` : `Usuario ${r.user_id}`}
                    <div className="hint mono" style={{ fontSize: '0.72rem' }}>
                      {r.user?.correo}
                    </div>
                  </td>
                  <td className="mono">{fechaLegible(r.fecha)}</td>
                  <td className="mono">
                    {hora(r.hora_inicio)}–{hora(r.hora_fin)}
                  </td>
                  <td>{r.motivo}</td>
                  <td>
                    <EstadoReserva estado={r.estado} />
                  </td>
                  <td>
                    {r.estado === 'CONFIRMADA' ? (
                      <button className="btn btn--sm btn--danger" onClick={() => cancelar(r)}>
                        Cancelar
                      </button>
                    ) : (
                      <span className="hint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
