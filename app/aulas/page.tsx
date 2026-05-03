import Link from 'next/link'
import AulaForm from '../components/AulaForm'

export default function AulasPage() {
  return (
    <div className="container">
      <header className="page-header-inner">
        <Link href="/" className="back-link">← Volver al Dashboard</Link>
        <h1>🏫 Aulas</h1>
        <p className="subtitle">Registrar nuevas aulas disponibles</p>
      </header>

      <AulaForm />
    </div>
  )
}
