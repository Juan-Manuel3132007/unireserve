import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface Errores {
  nombre?: string
  apellido?: string
  correo?: string
  password?: string
  confirmacion?: string
}

export function Registro() {
  const { register, user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [datos, setDatos] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmacion: '',
  })
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (user) return <Navigate to="/app" replace />

  function actualizar(campo: keyof typeof datos, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  /** Validacion en el cliente. El backend vuelve a validar todo. */
  function validar(): boolean {
    const nuevos: Errores = {}
    if (datos.nombre.trim().length < 2) nuevos.nombre = 'Escriba al menos 2 caracteres.'
    if (datos.apellido.trim().length < 2) nuevos.apellido = 'Escriba al menos 2 caracteres.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) nuevos.correo = 'Correo no valido.'
    if (
      datos.password.length < 8 ||
      !/[A-Z]/.test(datos.password) ||
      !/[a-z]/.test(datos.password) ||
      !/\d/.test(datos.password)
    ) {
      nuevos.password = 'Minimo 8 caracteres, con mayuscula, minuscula y numero.'
    }
    if (datos.password !== datos.confirmacion) nuevos.confirmacion = 'Las contrasenas no coinciden.'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErrorGeneral(null)
    if (!validar()) return

    setEnviando(true)
    try {
      await register({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo.trim(),
        password: datos.password,
      })
      toast.exito('Cuenta creada. Bienvenido a UniReserve.')
      navigate('/app', { replace: true })
    } catch (e) {
      setErrorGeneral(e instanceof ApiError ? e.message : 'No fue posible crear la cuenta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Link to="/" className="brand" style={{ color: 'var(--brand)' }}>
            Uni<span style={{ color: 'var(--brand-bright)' }}>Reserve</span>
          </Link>
        </div>

        <div className="card">
          <h1 style={{ fontSize: 'var(--step-2)', marginBottom: '0.35rem' }}>Crear cuenta</h1>
          <p className="hint" style={{ marginBottom: '1rem' }}>
            Las cuentas creadas aqui quedan con rol de estudiante.
          </p>

          {errorGeneral && (
            <div className="alert alert--error" role="alert" style={{ marginBottom: '0.9rem' }}>
              {errorGeneral}
            </div>
          )}

          <form className="form" onSubmit={enviar} noValidate>
            <div className="form-row">
              <div>
                <label htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  value={datos.nombre}
                  aria-invalid={!!errores.nombre}
                  onChange={(e) => actualizar('nombre', e.target.value)}
                />
                {errores.nombre && <p className="field-error">{errores.nombre}</p>}
              </div>
              <div>
                <label htmlFor="apellido">Apellido</label>
                <input
                  id="apellido"
                  value={datos.apellido}
                  aria-invalid={!!errores.apellido}
                  onChange={(e) => actualizar('apellido', e.target.value)}
                />
                {errores.apellido && <p className="field-error">{errores.apellido}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="correo-registro">Correo</label>
              <input
                id="correo-registro"
                type="email"
                value={datos.correo}
                aria-invalid={!!errores.correo}
                onChange={(e) => actualizar('correo', e.target.value)}
              />
              {errores.correo && <p className="field-error">{errores.correo}</p>}
            </div>

            <div>
              <label htmlFor="password-registro">Contrasena</label>
              <input
                id="password-registro"
                type="password"
                autoComplete="new-password"
                value={datos.password}
                aria-invalid={!!errores.password}
                onChange={(e) => actualizar('password', e.target.value)}
              />
              {errores.password ? (
                <p className="field-error">{errores.password}</p>
              ) : (
                <p className="hint">Minimo 8 caracteres, con mayuscula, minuscula y numero.</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmacion">Confirmar contrasena</label>
              <input
                id="confirmacion"
                type="password"
                autoComplete="new-password"
                value={datos.confirmacion}
                aria-invalid={!!errores.confirmacion}
                onChange={(e) => actualizar('confirmacion', e.target.value)}
              />
              {errores.confirmacion && <p className="field-error">{errores.confirmacion}</p>}
            </div>

            <button className="btn" type="submit" disabled={enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="auth-switch">
          Ya tiene cuenta? <Link to="/login">Iniciar sesion</Link>
        </p>
      </div>
    </div>
  )
}
