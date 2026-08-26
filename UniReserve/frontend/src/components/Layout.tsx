/** Estructura comun de las paginas privadas: barra lateral + contenido. */
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, esAdmin, logout } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Uni<span>Reserve</span>
        </div>

        <nav className="nav">
          <NavLink to="/app">Panel</NavLink>
          <NavLink to="/app/espacios">Espacios</NavLink>
          <NavLink to="/app/reservar">Reservar</NavLink>
          <NavLink to="/app/mis-reservas">Mis reservas</NavLink>

          {esAdmin && (
            <>
              <div className="nav-group-label">Administracion</div>
              <NavLink to="/app/admin/espacios">Gestionar espacios</NavLink>
              <NavLink to="/app/admin/usuarios">Usuarios</NavLink>
              <NavLink to="/app/admin/reservas">Todas las reservas</NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-name">
            {user?.nombre} {user?.apellido}
          </div>
          <div className="sidebar-user-role">{user?.rol}</div>
          <button
            className="btn btn--ghost btn--sm"
            style={{ marginTop: '0.7rem', width: '100%' }}
            onClick={logout}
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
