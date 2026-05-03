import Link from 'next/link'

const modules = [
  {
    href: '/docentes',
    icon: '👨‍🏫',
    title: 'Docentes',
    description: 'Registrar y gestionar profesores del sistema',
    color: '#3b82f6',
  },
  {
    href: '/cursos',
    icon: '📚',
    title: 'Cursos',
    description: 'Registrar y gestionar cursos académicos',
    color: '#8b5cf6',
  },
  {
    href: '/aulas',
    icon: '🏫',
    title: 'Aulas',
    description: 'Registrar y gestionar aulas disponibles',
    color: '#f59e0b',
  },
]

export default function HomePage() {
  return (
    <div className="container">
      <header className="page-header">
        <h1>Organizador de Horarios</h1>
        <p className="subtitle">Sistema de gestión para universidades y escuelas</p>
      </header>

      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div>
            <p className="stat-number">3</p>
            <p className="stat-label">Módulos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <div>
            <p className="stat-number">Activo</p>
            <p className="stat-label">Estado</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔧</span>
          <div>
            <p className="stat-number">Dev</p>
            <p className="stat-label">Modo</p>
          </div>
        </div>
      </div>

      {/* Módulos */}
      <section className="section">
        <h2>Módulos Disponibles</h2>
        <p className="section-subtitle">Selecciona un módulo para comenzar a registrar datos</p>

        <div className="modules-grid">
          {modules.map((mod) => (
            <Link href={mod.href} key={mod.href} className="module-card" style={{ '--accent': mod.color } as React.CSSProperties}>
              <div className="module-icon">{mod.icon}</div>
              <h3 className="module-title">{mod.title}</h3>
              <p className="module-desc">{mod.description}</p>
              <span className="module-action">
                Ingresar →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Info */}
      <div className="info-card">
        <h3>💡 ¿Cómo funciona?</h3>
        <p>Al enviar un formulario, los datos se imprimen en:</p>
        <ul>
          <li><strong>Consola del servidor</strong> — Terminal donde ejecutas <code>npm run dev</code></li>
          <li><strong>Consola del navegador</strong> — DevTools → Console (F12)</li>
        </ul>
      </div>
    </div>
  )
}