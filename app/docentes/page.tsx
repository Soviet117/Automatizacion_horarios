import Link from 'next/link'
import DocenteForm from '../components/DocenteForm'

export default function DocentesPage() {
  return (
    <div className="container">
      <header className="page-header-inner">
        <Link href="/" className="back-link">← Volver al Dashboard</Link>
        <h1>👨‍🏫 Docentes</h1>
        <p className="subtitle">Registrar nuevos profesores en el sistema</p>
      </header>

      <DocenteForm />
    </div>
  )
}
