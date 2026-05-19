import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ExcelImport from './components/ExcelImport';

async function getStats() {
  try {
    const [docentes, cursos, aulas] = await Promise.all([
      prisma.docente.count(),
      prisma.curso.count(),
      prisma.aula.count(),
    ]);
    return { docentes, cursos, aulas };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { docentes: 0, cursos: 0, aulas: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  const modules = [
    {
      href: '/docentes',
      icon: '👨‍🏫',
      title: 'Docentes',
      description: 'Gestión de profesores, especialidades y datos personales.',
      color: '#3b82f6',
      count: stats.docentes,
    },
    {
      href: '/cursos',
      icon: '📚',
      title: 'Cursos',
      description: 'Administración de asignaturas, créditos y mallas curriculares.',
      color: '#8b5cf6',
      count: stats.cursos,
    },
    {
      href: '/aulas',
      icon: '🏫',
      title: 'Aulas',
      description: 'Control de espacios físicos, laboratorios y capacidades.',
      color: '#f59e0b',
      count: stats.aulas,
    },
  ];

  return (
    <div className="container">
      <header className="page-header">
        <h1>Organizador de Horarios</h1>
        <p className="subtitle">Gestión Académica Centralizada e Inteligente</p>
      </header>

      {/* Dashboard Stats Summary */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div>
            <p className="stat-number">{stats.docentes}</p>
            <p className="stat-label">Docentes</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📖</span>
          <div>
            <p className="stat-number">{stats.cursos}</p>
            <p className="stat-label">Cursos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏗️</span>
          <div>
            <p className="stat-number">{stats.aulas}</p>
            <p className="stat-label">Aulas</p>
          </div>
        </div>
      </div>

      {/* Módulos de Configuración Manual */}
      <section className="section">
        <h2>Registro Manual</h2>
        <p className="section-subtitle">Ingresa los datos base paso a paso para la generación de horarios</p>

        <div className="modules-grid">
          {modules.map((mod) => (
            <Link
              href={mod.href}
              key={mod.href}
              className="module-card"
              style={{ '--accent': mod.color } as React.CSSProperties}
            >
              <div className="module-icon">{mod.icon}</div>
              <h3 className="module-title">{mod.title}</h3>
              <p className="module-desc">{mod.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="module-action">Configurar →</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{mod.count} registros</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Importación Masiva (Excel) */}
      <ExcelImport />

      {/* Próximos pasos */}
      <div className="info-card">
        <h3>🚀 Próximos Pasos</h3>
        <p>Una vez completado el registro de datos maestros (sea manual o por carga masiva), podrás proceder a:</p>
        <ul>
          <li>
            <strong>Generar Horarios</strong> — Algoritmo de distribución automática
          </li>
          <li>
            <strong>Gestionar Conflictos</strong> — Detección de cruces de docentes y aulas
          </li>
          <li>
            <strong>Exportar Reportes</strong> — PDF y Excel para facultades
          </li>
        </ul>
      </div>
    </div>
  );
}