/**
 * El formulario de registro valida en el cliente antes de llamar a la API.
 * Estas pruebas garantizan que un formulario invalido nunca llegue al backend.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Registro } from '../Registro'
import { AuthProvider } from '../../context/AuthContext'
import { ToastProvider } from '../../context/ToastContext'
import { api } from '../../api/client'

function montar() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <Registro />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('Formulario de registro', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('muestra los campos exigidos por el requisito', () => {
    montar()
    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^apellido$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^correo$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^contrasena$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar contrasena/i)).toBeInTheDocument()
  })

  it('rechaza contrasenas que no coinciden sin llamar a la API', async () => {
    const registrar = vi.spyOn(api, 'register')
    const usuario = userEvent.setup()
    montar()

    await usuario.type(screen.getByLabelText(/^nombre$/i), 'Ana')
    await usuario.type(screen.getByLabelText(/^apellido$/i), 'Gomez')
    await usuario.type(screen.getByLabelText(/^correo$/i), 'ana@test.com')
    await usuario.type(screen.getByLabelText(/^contrasena$/i), 'Segura123')
    await usuario.type(screen.getByLabelText(/confirmar contrasena/i), 'Distinta123')
    await usuario.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('rechaza contrasenas debiles', async () => {
    const registrar = vi.spyOn(api, 'register')
    const usuario = userEvent.setup()
    montar()

    await usuario.type(screen.getByLabelText(/^nombre$/i), 'Ana')
    await usuario.type(screen.getByLabelText(/^apellido$/i), 'Gomez')
    await usuario.type(screen.getByLabelText(/^correo$/i), 'ana@test.com')
    await usuario.type(screen.getByLabelText(/^contrasena$/i), 'corta')
    await usuario.type(screen.getByLabelText(/confirmar contrasena/i), 'corta')
    await usuario.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText(/minimo 8 caracteres/i)).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('envia los datos a la API cuando el formulario es valido', async () => {
    const registrar = vi.spyOn(api, 'register').mockResolvedValue({
      access_token: 'token-de-prueba',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 1,
        nombre: 'Ana',
        apellido: 'Gomez',
        correo: 'ana@test.com',
        rol: 'ESTUDIANTE',
        activo: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    })
    const usuario = userEvent.setup()
    montar()

    await usuario.type(screen.getByLabelText(/^nombre$/i), 'Ana')
    await usuario.type(screen.getByLabelText(/^apellido$/i), 'Gomez')
    await usuario.type(screen.getByLabelText(/^correo$/i), 'ana@test.com')
    await usuario.type(screen.getByLabelText(/^contrasena$/i), 'Segura123')
    await usuario.type(screen.getByLabelText(/confirmar contrasena/i), 'Segura123')
    await usuario.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() =>
      expect(registrar).toHaveBeenCalledWith({
        nombre: 'Ana',
        apellido: 'Gomez',
        correo: 'ana@test.com',
        password: 'Segura123',
      }),
    )
  })
})
