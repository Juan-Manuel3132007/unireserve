import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (user) return <Navigate to="/app" replace />

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await login(correo.trim(), password)
      navigate(location.state?.from ?? '/app', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No fue posible iniciar sesion.')
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
          <h1 style={{ fontSize: 'var(--step-2)', marginBottom: '1rem' }}>Iniciar sesion</h1>

          {error && (
            <div className="alert alert--error" role="alert" style={{ marginBottom: '0.9rem' }}>
              {error}
            </div>
          )}

          <form className="form" onSubmit={enviar} noValidate>
            <div>
              <label htmlFor="correo">Correo institucional</label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="nombre@unireserve.com"
              />
            </div>
            <div>
              <label htmlFor="password">Contrasena</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={enviando}>
              {enviando ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="auth-switch">
          No tiene cuenta? <Link to="/registro">Registrese como estudiante</Link>
        </p>
      </div>
    </div>
  )
}
