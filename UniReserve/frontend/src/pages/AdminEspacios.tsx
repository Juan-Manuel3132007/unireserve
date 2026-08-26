import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { api, ApiError } from '../api/client'
import type { Space, SpaceStatus, SpaceType } from '../api/types'
import { SPACE_STATUS_LABEL, SPACE_TYPE_LABEL } from '../api/types'
import { Cargando, ErrorApi, EstadoEspacio, Vacio } from '../components/ui'
import { useToast } from '../context/ToastContext'

const FORMULARIO_VACIO = {
  nombre: '',
  descripcion: '',
  ubicacion: '',
  capacidad: '10',
  tipo: 'SALA_ESTUDIO' as SpaceType,
  estado: 'DISPONIBLE' as SpaceStatus,
}

export function AdminEspacios() {
  const toast = useToast()
  const [espacios, setEspacios] = useState<Space[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

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

  function editar(espacio: Space) {
    setEditandoId(espacio.id)
    setErrorFormulario(null)
    setFormulario({
      nombre: espacio.nombre,
      descripcion: espacio.descripcion ?? '',
      ubicacion: espacio.ubicacion,
      capacidad: String(espacio.capacidad),
      tipo: espacio.tipo,
      estado: espacio.estado,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function limpiar() {
    setEditandoId(null)
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario(null)
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setErrorFormulario(null)
    setGuardando(true)

    const payload = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      ubicacion: formulario.ubicacion.trim(),
      capacidad: Number(formulario.capacidad),
      tipo: formulario.tipo,
      estado: formulario.estado,
    }

    try {
      if (editandoId) {
        const actualizado = await api.updateSpace(editandoId, payload as Partial<Space>)
        setEspacios((prev) => prev.map((e) => (e.id === editandoId ? actualizado : e)))
        toast.exito('Espacio actualizado.')
      } else {
        const creado = await api.createSpace(payload as Partial<Space>)
        setEspacios((prev) => [...prev, creado])
        toast.exito('Espacio creado.')
      }
      limpiar()
    } catch (e) {
      setErrorFormulario(e instanceof ApiError ? e.message : 'No fue posible guardar el espacio.')
    } finally {
      setGuardando(false)
    }
  }

  async function deshabilitar(espacio: Space) {
    if (!window.confirm(`Deshabilitar «${espacio.nombre}»? No admitira nuevas reservas.`)) return
    try {
      const actualizado = await api.disableSpace(espacio.id)
      setEspacios((prev) => prev.map((e) => (e.id === espacio.id ? actualizado : e)))
      toast.exito('Espacio deshabilitado.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No fue posible deshabilitar el espacio.')
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Gestionar espacios</h1>
        <p>Cree espacios nuevos, corrija su informacion o retirelos de circulacion.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.75rem', maxWidth: 760 }}>
        <h2 style={{ marginBottom: '0.9rem' }}>
          {editandoId ? 'Editar espacio' : 'Crear un espacio'}
        </h2>

        {errorFormulario && (
          <div className="alert alert--error" role="alert" style={{ marginBottom: '0.9rem' }}>
            {errorFormulario}
          </div>
        )}

        <form className="form" onSubmit={guardar} noValidate>
          <div className="form-row">
            <div>
              <label htmlFor="nombre-espacio">Nombre</label>
              <input
                id="nombre-espacio"
                required
                minLength={3}
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="ubicacion-espacio">Ubicacion</label>
              <input
                id="ubicacion-espacio"
                required
                minLength={3}
                placeholder="Bloque 1 - Piso 2"
                value={formulario.ubicacion}
                onChange={(e) => setFormulario({ ...formulario, ubicacion: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="tipo-espacio">Tipo</label>
              <select
                id="tipo-espacio"
                value={formulario.tipo}
                onChange={(e) =>
                  setFormulario({ ...formulario, tipo: e.target.value as SpaceType })
                }
              >
                {(Object.keys(SPACE_TYPE_LABEL) as SpaceType[]).map((t) => (
                  <option key={t} value={t}>
                    {SPACE_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="capacidad-espacio">Capacidad</label>
              <input
                id="capacidad-espacio"
                type="number"
                min={1}
                required
                value={formulario.capacidad}
                onChange={(e) => setFormulario({ ...formulario, capacidad: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="estado-espacio">Estado</label>
            <select
              id="estado-espacio"
              value={formulario.estado}
              onChange={(e) =>
                setFormulario({ ...formulario, estado: e.target.value as SpaceStatus })
              }
            >
              {(Object.keys(SPACE_STATUS_LABEL) as SpaceStatus[]).map((s) => (
                <option key={s} value={s}>
                  {SPACE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="descripcion-espacio">Descripcion</label>
            <textarea
              id="descripcion-espacio"
              rows={2}
              value={formulario.descripcion}
              onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
            />
          </div>

          <div className="btn-row">
            <button className="btn" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear espacio'}
            </button>
            {editandoId && (
              <button className="btn btn--ghost" type="button" onClick={limpiar}>
                Cancelar edicion
              </button>
            )}
          </div>
        </form>
      </div>

      {cargando && <Cargando />}
      {error && <ErrorApi mensaje={error} onReintentar={cargar} />}

      {!cargando && !error && espacios.length === 0 && (
        <Vacio titulo="No hay espacios registrados" descripcion="Cree el primero con el formulario de arriba." />
      )}

      {!cargando && !error && espacios.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Ubicacion</th>
                <th>Capacidad</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {espacios.map((e) => (
                <tr key={e.id}>
                  <td>{e.nombre}</td>
                  <td>{SPACE_TYPE_LABEL[e.tipo]}</td>
                  <td>{e.ubicacion}</td>
                  <td className="mono">{e.capacidad}</td>
                  <td>
                    <EstadoEspacio estado={e.estado} />
                  </td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn--sm btn--ghost" onClick={() => editar(e)}>
                        Editar
                      </button>
                      {e.estado !== 'DESHABILITADO' && (
                        <button className="btn btn--sm btn--danger" onClick={() => deshabilitar(e)}>
                          Deshabilitar
                        </button>
                      )}
                    </div>
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
