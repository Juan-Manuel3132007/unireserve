import { useEffect, useState } from 'react'

import { api, ApiError } from '../api/client'
import type { User } from '../api/types'
import { Cargando, ErrorApi, Vacio } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function AdminUsuarios() {
  const toast = useToast()
  const { user: actual } = useAuth()
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [buscar, setBuscar] = useState('')

  function cargar() {
    setCargando(true)
    setError(null)
    api
      .listUsers()
      .then((pagina) => setUsuarios(pagina.items))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  async function desactivar(usuario: User) {
    if (!window.confirm(`Desactivar la cuenta de ${usuario.nombre} ${usuario.apellido}?`)) return
    try {
      const actualizado = await api.deactivateUser(usuario.id)
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? actualizado : u)))
      toast.exito('Cuenta desactivada.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No fue posible desactivar la cuenta.')
    }
  }

  const filtrados = usuarios.filter((u) =>
    `${u.nombre} ${u.apellido} ${u.correo}`.toLowerCase().includes(buscar.toLowerCase()),
  )

  return (
    <>
      <div className="page-head">
        <h1>Usuarios</h1>
        <p>Consulte las cuentas registradas y desactive las que ya no deban tener acceso.</p>
      </div>

      <div className="filters">
        <div style={{ flex: '1 1 280px' }}>
          <label htmlFor="buscar-usuario">Buscar</label>
          <input
            id="buscar-usuario"
            value={buscar}
            placeholder="Nombre o correo"
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>
      </div>

      {cargando && <Cargando />}
      {error && <ErrorApi mensaje={error} onReintentar={cargar} />}

      {!cargando && !error && filtrados.length === 0 && (
        <Vacio titulo="Ningun usuario coincide" descripcion="Pruebe con otro nombre o correo." />
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.nombre} {u.apellido}
                  </td>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>
                    {u.correo}
                  </td>
                  <td>
                    <span className={`badge ${u.rol === 'ADMINISTRADOR' ? 'badge--brand' : ''}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge--ok' : 'badge--off'}`}>
                      {u.activo ? 'Activa' : 'Desactivada'}
                    </span>
                  </td>
                  <td>
                    {u.activo && u.id !== actual?.id ? (
                      <button className="btn btn--sm btn--danger" onClick={() => desactivar(u)}>
                        Desactivar
                      </button>
                    ) : (
                      <span className="hint">{u.id === actual?.id ? 'Es su cuenta' : '—'}</span>
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
