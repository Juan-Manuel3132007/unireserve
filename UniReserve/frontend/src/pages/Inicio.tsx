import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function Inicio() {
  const { user } = useAuth()

  return (
    <div className="landing">
      <header className="landing-top">
        <div className="brand">
          Uni<span>Reserve</span>
        </div>
        <div className="btn-row">
          {user ? (
            <Link className="btn" to="/app">
              Ir al panel
            </Link>
          ) : (
            <>
              <Link className="btn btn--ghost" to="/login">
                Iniciar sesion
              </Link>
              <Link className="btn" to="/registro">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Gestion de espacios del campus</p>
          <h1>Ver quien tiene el aula, y a que hora.</h1>
          <p className="hero-lead">
            UniReserve reemplaza el cuaderno de la porteria y los mensajes sueltos por un
            registro unico de salas, laboratorios y auditorios. Consulte la jornada completa,
            reserve la franja que necesita y evite que dos grupos lleguen al mismo salon.
          </p>
          <div className="btn-row">
            <Link className="btn" to={user ? '/app/espacios' : '/registro'}>
              {user ? 'Ver espacios disponibles' : 'Empezar ahora'}
            </Link>
            <Link className="btn btn--ghost" to="/login">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.15rem' }}>Sala de estudio 101</h3>
          <p className="mono" style={{ color: 'var(--ink-faint)', fontSize: '0.78rem' }}>
            BLOQUE 1 · PISO 1 · 8 PERSONAS
          </p>
          <div className="timeline">
            <div className="timeline-track">
              <div className="timeline-block" style={{ left: '18.75%', width: '6.25%' }} />
              <div className="timeline-block" style={{ left: '25%', width: '9.375%' }} />
              <div className="timeline-block" style={{ left: '50%', width: '12.5%' }} />
            </div>
            <div className="timeline-hours">
              <span>06:00</span>
              <span>10:00</span>
              <span>14:00</span>
              <span>18:00</span>
              <span>22:00</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '0.9rem' }}>
            Asi se ve un dia cualquiera: las bandas oscuras ya estan tomadas, el resto de la
            jornada esta libre.
          </p>
        </div>
      </section>

      <section className="feature-list">
        <div>
          <span className="feature-num">01 / CONSULTA</span>
          <h3>Disponibilidad real</h3>
          <p>
            Cada espacio muestra su jornada de 6:00 a 22:00 con las franjas ya tomadas, tomadas
            directamente de la base de datos.
          </p>
        </div>
        <div>
          <span className="feature-num">02 / RESERVA</span>
          <h3>Sin choques de horario</h3>
          <p>
            El servidor rechaza cualquier reserva que se cruce con otra existente para el mismo
            espacio y explica con que reserva choca.
          </p>
        </div>
        <div>
          <span className="feature-num">03 / CONTROL</span>
          <h3>Roles diferenciados</h3>
          <p>
            Los estudiantes gestionan sus propias reservas. Los administradores gestionan
            espacios, usuarios y el calendario completo.
          </p>
        </div>
      </section>
    </div>
  )
}
