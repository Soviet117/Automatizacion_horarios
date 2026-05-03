import Link from 'next/link'
import CursoForm from '../components/CursoForm'

export default function CursosPage() {
  return (
    <div className="container">
      <header className="page-header-inner">
        <Link href="/" className="back-link">← Volver al Dashboard</Link>
        <h1>📚 Cursos</h1>
        <p className="subtitle">Registrar nuevos cursos académicos</p>
      </header>

      <CursoForm />
    </div>
  )
}
