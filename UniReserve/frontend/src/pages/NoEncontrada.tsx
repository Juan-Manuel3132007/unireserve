import { Link } from 'react-router-dom'

export function NoEncontrada() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <p className="eyebrow">Error 404</p>
        <h1 style={{ marginBottom: '0.7rem' }}>Esa pagina no existe</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          Revise la direccion o vuelva al panel para seguir gestionando sus reservas.
        </p>
        <Link className="btn" to="/" style={{ marginTop: '1rem' }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
