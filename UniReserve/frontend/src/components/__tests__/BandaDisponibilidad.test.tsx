/**
 * La banda de disponibilidad es el componente critico de la interfaz:
 * si posiciona mal un bloque, el usuario lee mal el horario.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BandaDisponibilidad } from '../BandaDisponibilidad'

describe('BandaDisponibilidad', () => {
  it('describe una jornada libre cuando no hay franjas ocupadas', () => {
    render(<BandaDisponibilidad ocupado={[]} />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/completamente libre/i)
  })

  it('posiciona el bloque de 6:00 a 7:00 al inicio de la banda', () => {
    const { container } = render(
      <BandaDisponibilidad
        ocupado={[{ reservation_id: 1, hora_inicio: '06:00', hora_fin: '07:00' }]}
      />,
    )
    const bloque = container.querySelector('.timeline-block') as HTMLElement
    // La jornada dura 16 h; 1 h equivale a 6.25 % del ancho.
    expect(bloque.style.left).toBe('0%')
    expect(bloque.style.width).toBe('6.25%')
  })

  it('posiciona el bloque de 14:00 a 16:00 en la mitad de la banda', () => {
    const { container } = render(
      <BandaDisponibilidad
        ocupado={[{ reservation_id: 2, hora_inicio: '14:00', hora_fin: '16:00' }]}
      />,
    )
    const bloque = container.querySelector('.timeline-block') as HTMLElement
    expect(bloque.style.left).toBe('50%')
    expect(bloque.style.width).toBe('12.5%')
  })

  it('dibuja un bloque por cada franja ocupada', () => {
    const { container } = render(
      <BandaDisponibilidad
        ocupado={[
          { reservation_id: 1, hora_inicio: '08:00', hora_fin: '09:00' },
          { reservation_id: 2, hora_inicio: '10:00', hora_fin: '11:30' },
        ]}
      />,
    )
    expect(container.querySelectorAll('.timeline-block')).toHaveLength(2)
  })
})
