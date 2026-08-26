import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { api, ApiError } from '../api/client'
import type { Availability, Space } from '../api/types'
import { SPACE_TYPE_LABEL } from '../api/types'
import { BandaDisponibilidad } from '../components/BandaDisponibilidad'
import { Cargando, ErrorApi, hoyIso } from '../components/ui'
import { useToast } from '../context/ToastContext'

export function NuevaReserva() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [espacios, setEspacios] = useState<Space[]>([])
  const [cargandoEspacios, setCargandoEspacios] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [spaceId, setSpaceId] = useState(params.get('space') ?? '')
  const [fecha, setFecha] = useState(params.get('fecha') ?? hoyIso())
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFin, setHoraFin] = useState('10:00')
  const [motivo, setMotivo] = useState('')

  const [disponibilidad, setDisponibilidad] = useState<Availability | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function cargarEspacios() {
    setCargandoEspacios(true)
    setErrorCarga(null)
    api
      .listSpaces({ estado: 'DISPONIBLE' })
      .then((pagina) => {
        setEspacios(pagina.items)
        if (!spaceId && pagina.items.length > 0) setSpaceId(String(pagina.items[0].id))
      })
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargandoEspacios(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(cargarEspacios, [])

  // Cada vez que cambia el espacio o la fecha se refrescan las franjas ocupadas,
  // para que el usuario vea el conflicto antes de enviar el formulario.
  useEffect(() => {
    if (!spaceId || !fecha) return
    api
      .getAvailability(Number(spaceId), fecha)
      .then(setDisponibilidad)
      .catch(() => setDisponibilidad(null))
  }, [spaceId, fecha])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)

    if (horaFin <= horaInicio) {
      setError('La hora de finalizacion debe ser posterior a la hora de inicio.')
      return
    }
    if (motivo.trim().length < 3) {
      setError('Describa brevemente el motivo de la reserva.')
      return
    }

    setEnviando(true)
    try {
      await api.createReservation({
        space_id: Number(spaceId),
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        motivo: motivo.trim(),
      })
      toast.exito('Reserva confirmada.')
      navigate('/app/mis-reservas')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No fue posible crear la reserva.')
      // Se refresca la banda: puede que otra persona haya tomado la franja.
      api.getAvailability(Number(spaceId), fecha).then(setDisponibilidad).catch(() => null)
    } finally {
      setEnviando(false)
    }
  }

  if (cargandoEspacios) return <Cargando />
  if (errorCarga) return <ErrorApi mensaje={errorCarga} onReintentar={cargarEspacios} />

  return (
    <>
      <div className="page-head">
        <h1>Reservar un espacio</h1>
        <p>Elija el espacio y la franja. La banda muestra que horas ya estan tomadas ese dia.</p>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        {error && (
          <div className="alert alert--error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form className="form" onSubmit={enviar} noValidate>
          <div>
            <label htmlFor="espacio">Espacio</label>
            <select
              id="espacio"
              value={spaceId}
              required
              onChange={(e) => setSpaceId(e.target.value)}
            >
              {espacios.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} — {SPACE_TYPE_LABEL[e.tipo]} ({e.capacidad} personas)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha-reserva">Fecha</label>
            <input
              id="fecha-reserva"
              type="date"
              value={fecha}
              min={hoyIso()}
              required
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {disponibilidad && <BandaDisponibilidad ocupado={disponibilidad.ocupado} />}

          <div className="form-row">
            <div>
              <label htmlFor="inicio">Hora de inicio</label>
              <input
                id="inicio"
                type="time"
                value={horaInicio}
                step={900}
                required
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="fin">Hora de finalizacion</label>
              <input
                id="fin"
                type="time"
                value={horaFin}
                step={900}
                required
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
          </div>
          <p className="hint">El campus atiende de 06:00 a 22:00.</p>

          <div>
            <label htmlFor="motivo">Motivo</label>
            <input
              id="motivo"
              value={motivo}
              maxLength={255}
              required
              placeholder="Ej: sustentacion del proyecto de Gestion de la Configuracion"
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <button className="btn" type="submit" disabled={enviando || espacios.length === 0}>
            {enviando ? 'Confirmando…' : 'Confirmar reserva'}
          </button>
        </form>
      </div>
    </>
  )
}
