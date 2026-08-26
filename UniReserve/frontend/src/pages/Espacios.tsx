import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import type { Space, SpaceType } from '../api/types'
import { SPACE_TYPE_LABEL } from '../api/types'
import { Cargando, ErrorApi, EstadoEspacio, Vacio } from '../components/ui'

export function Espacios() {
  const [espacios, setEspacios] = useState<Space[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<string>('')
  const [capacidadMin, setCapacidadMin] = useState<string>('')
  const [soloDisponibles, setSoloDisponibles] = useState(true)
  const [buscar, setBuscar] = useState('')

  function cargar() {
    setCargando(true)
    setError(null)
    api
      .listSpaces()
      .then((pagina) => setEspacios(pagina.items))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  // El filtrado se hace en memoria porque el catalogo de espacios de una
  // universidad es pequeno; si creciera, estos filtros pasarian a la API,
  // que ya los soporta como query params.
  const filtrados = useMemo(
    () =>
      espacios.filter((e) => {
        if (tipo && e.tipo !== tipo) return false
        if (capacidadMin && e.capacidad < Number(capacidadMin)) return false
        if (soloDisponibles && e.estado !== 'DISPONIBLE') return false
        if (buscar) {
          const texto = `${e.nombre} ${e.ubicacion}`.toLowerCase()
          if (!texto.includes(buscar.toLowerCase())) return false
        }
        return true
      }),
    [espacios, tipo, capacidadMin, soloDisponibles, buscar],
  )

  return (
    <>
      <div className="page-head">
        <h1>Espacios del campus</h1>
        <p>Filtre por tipo o capacidad y abra un espacio para ver su jornada completa.</p>
      </div>

      <div className="filters">
        <div style={{ flex: '1 1 220px' }}>
          <label htmlFor="buscar">Buscar</label>
          <input
            id="buscar"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Nombre o ubicacion"
          />
        </div>
        <div>
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {(Object.keys(SPACE_TYPE_LABEL) as SpaceType[]).map((t) => (
              <option key={t} value={t}>
                {SPACE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="capacidad">Capacidad minima</label>
          <input
            id="capacidad"
            type="number"
            min={1}
            value={capacidadMin}
            onChange={(e) => setCapacidadMin(e.target.value)}
            placeholder="Sin minimo"
          />
        </div>
        <div style={{ minWidth: 'auto' }}>
          <label htmlFor="disponibles" style={{ whiteSpace: 'nowrap' }}>
            <input
              id="disponibles"
              type="checkbox"
              checked={soloDisponibles}
              onChange={(e) => setSoloDisponibles(e.target.checked)}
              style={{ width: 'auto', marginRight: '0.4rem' }}
            />
            Solo disponibles
          </label>
        </div>
      </div>

      {cargando && <Cargando />}
      {error && <ErrorApi mensaje={error} onReintentar={cargar} />}

      {!cargando && !error && filtrados.length === 0 && (
        <Vacio
          titulo="Ningun espacio coincide"
          descripcion="Ajuste los filtros o desactive «Solo disponibles» para ver todo el catalogo."
        />
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <div className="grid">
          {filtrados.map((espacio) => (
            <article key={espacio.id} className="card">
              <div className="space-card-head">
                <h3>{espacio.nombre}</h3>
                <EstadoEspacio estado={espacio.estado} />
              </div>
              <span className="badge badge--brand">{SPACE_TYPE_LABEL[espacio.tipo]}</span>
              <div className="space-meta">
                <span>{espacio.ubicacion}</span>
                <span>
                  Capacidad <strong>{espacio.capacidad}</strong> personas
                </span>
              </div>
              <Link className="btn btn--sm" to={`/app/espacios/${espacio.id}`}>
                Ver disponibilidad
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
