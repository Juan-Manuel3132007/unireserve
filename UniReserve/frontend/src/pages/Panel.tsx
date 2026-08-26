import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import type { DashboardStats, Reservation } from '../api/types'
import { Cargando, ErrorApi, EstadoReserva, fechaLegible, hora, hoyIso, Vacio } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function Panel() {
  const { user, esAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reservas, setReservas] = useState<Reservation[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function cargar() {
    setCargando(true)
    setError(null)
    Promise.all([api.dashboard(), api.listReservations({ estado: 'CONFIRMADA' })])
      .then(([metricas, pagina]) => {
        setStats(metricas)
        setReservas(pagina.items)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  if (cargando) return <Cargando />
  if (error) return <ErrorApi mensaje={error} onReintentar={cargar} />

  const hoy = hoyIso()
  const proximas = reservas
    .filter((r) => r.fecha >= hoy)
    .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio))
    .slice(0, 6)

  return (
    <>
      <div className="page-head">
        <h1>Hola, {user?.nombre}</h1>
        <p>
          {esAdmin
            ? 'Resumen del sistema y de las reservas mas recientes del campus.'
            : 'Este es el estado de sus reservas y de los espacios disponibles.'}
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '1.75rem' }}>
        {esAdmin ? (
          <>
            <Metrica valor={stats?.total_usuarios ?? 0} etiqueta="Usuarios registrados" />
            <Metrica valor={stats?.total_espacios ?? 0} etiqueta="Espacios" />
            <Metrica valor={stats?.total_reservas ?? 0} etiqueta="Reservas totales" />
            <Metrica valor={stats?.reservas_hoy ?? 0} etiqueta="Reservas para hoy" />
          </>
        ) : (
          <>
            <Metrica valor={stats?.reservas_proximas ?? 0} etiqueta="Reservas proximas" />
            <Metrica valor={stats?.total_reservas ?? 0} etiqueta="Reservas en total" />
            <Metrica valor={stats?.espacios_disponibles ?? 0} etiqueta="Espacios disponibles" />
          </>
        )}
      </div>

      <div className="btn-row" style={{ marginBottom: '1.75rem' }}>
        <Link className="btn" to="/app/reservar">
          Reservar un espacio
        </Link>
        <Link className="btn btn--ghost" to="/app/espacios">
          Ver disponibilidad
        </Link>
      </div>

      <h2 style={{ marginBottom: '0.85rem' }}>
        {esAdmin ? 'Reservas recientes del campus' : 'Sus proximas reservas'}
      </h2>

      {proximas.length === 0 ? (
        <Vacio
          titulo="Todavia no hay reservas proximas"
          descripcion={
            esAdmin
              ? 'Cuando los usuarios reserven espacios apareceran aqui.'
              : 'Elija un espacio y una franja libre para crear su primera reserva.'
          }
          accion={
            <Link className="btn" to="/app/reservar" style={{ marginTop: '0.9rem' }}>
              Crear una reserva
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
                {esAdmin && <th>Reservado por</th>}
                <th>Motivo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {proximas.map((r) => (
                <tr key={r.id}>
                  <td>{r.space?.nombre ?? `Espacio ${r.space_id}`}</td>
                  <td className="mono">{fechaLegible(r.fecha)}</td>
                  <td className="mono">
                    {hora(r.hora_inicio)}–{hora(r.hora_fin)}
                  </td>
                  {esAdmin && <td>{r.user ? `${r.user.nombre} ${r.user.apellido}` : '—'}</td>}
                  <td>{r.motivo}</td>
                  <td>
                    <EstadoReserva estado={r.estado} />
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

function Metrica({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="card">
      <div className="stat-value">{valor}</div>
      <div className="stat-label">{etiqueta}</div>
    </div>
  )
}
