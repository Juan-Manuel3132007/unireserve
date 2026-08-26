import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { RutaProtegida } from './components/RutaProtegida'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AdminEspacios } from './pages/AdminEspacios'
import { AdminReservas } from './pages/AdminReservas'
import { AdminUsuarios } from './pages/AdminUsuarios'
import { DetalleEspacio } from './pages/DetalleEspacio'
import { Espacios } from './pages/Espacios'
import { Inicio } from './pages/Inicio'
import { Login } from './pages/Login'
import { MisReservas } from './pages/MisReservas'
import { NoEncontrada } from './pages/NoEncontrada'
import { NuevaReserva } from './pages/NuevaReserva'
import { Panel } from './pages/Panel'
import { Registro } from './pages/Registro'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

            <Route element={<RutaProtegida />}>
              <Route path="/app" element={<Layout />}>
                <Route index element={<Panel />} />
                <Route path="espacios" element={<Espacios />} />
                <Route path="espacios/:id" element={<DetalleEspacio />} />
                <Route path="reservar" element={<NuevaReserva />} />
                <Route path="mis-reservas" element={<MisReservas />} />

                {/* Rutas administrativas: el backend vuelve a validar el rol. */}
                <Route element={<RutaProtegida soloAdmin />}>
                  <Route path="admin/espacios" element={<AdminEspacios />} />
                  <Route path="admin/usuarios" element={<AdminUsuarios />} />
                  <Route path="admin/reservas" element={<AdminReservas />} />
                </Route>
              </Route>
            </Route>

            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<NoEncontrada />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
