'use client'

import { useState } from 'react'

export default function CursoForm() {
  const [formData, setFormData] = useState({
    id_curso: '',
    creditos: '',
    nom_curso: '',
    id_carrera: '',
    modalidad: '',
    tipo_curso: '',
    id_ciclo: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    // Imprimir en consola del navegador
    console.log('═══════════════════════════════════════')
    console.log('📚 NUEVO CURSO (Browser Console)')
    console.log('═══════════════════════════════════════')
    console.log('Datos enviados:', formData)
    console.log('═══════════════════════════════════════')

    try {
      const res = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        console.log('✅ Respuesta del servidor:', data)
        setStatus('success')
        setMessage('Curso registrado exitosamente (ver consola del servidor)')
        setFormData({
          id_curso: '',
          creditos: '',
          nom_curso: '',
          id_carrera: '',
          modalidad: '',
          tipo_curso: '',
          id_ciclo: '',
        })
      } else {
        console.error('❌ Error:', data.error)
        setStatus('error')
        setMessage(data.error || 'Error al registrar curso')
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err)
      setStatus('error')
      setMessage('Error de conexión con el servidor')
    }

    setTimeout(() => {
      setStatus('idle')
      setMessage('')
    }, 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div className="form-header">
        <span className="form-icon">📚</span>
        <h3>Registrar Curso</h3>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="curso-id">ID Curso</label>
          <input
            id="curso-id"
            name="id_curso"
            type="text"
            placeholder="CUR-001"
            value={formData.id_curso}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="curso-creditos">Créditos</label>
          <input
            id="curso-creditos"
            name="creditos"
            type="number"
            placeholder="4"
            min="1"
            value={formData.creditos}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group form-group-full">
          <label htmlFor="curso-nombre">Nombre del Curso</label>
          <input
            id="curso-nombre"
            name="nom_curso"
            type="text"
            placeholder="Programación I"
            value={formData.nom_curso}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="curso-carrera">ID Carrera</label>
          <input
            id="curso-carrera"
            name="id_carrera"
            type="text"
            placeholder="CAR-001"
            value={formData.id_carrera}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="curso-modalidad">Modalidad</label>
          <select
            id="curso-modalidad"
            name="modalidad"
            value={formData.modalidad}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar...</option>
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="Semipresencial">Semipresencial</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="curso-tipo">Tipo de Curso</label>
          <input
            id="curso-tipo"
            name="tipo_curso"
            type="text"
            placeholder="Obligatorio"
            value={formData.tipo_curso}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="curso-ciclo">ID Ciclo</label>
          <input
            id="curso-ciclo"
            name="id_ciclo"
            type="number"
            placeholder="1"
            min="1"
            value={formData.id_ciclo}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <button type="submit" className="btn-submit" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <span className="btn-loading">⏳ Enviando...</span>
        ) : (
          '📤 Registrar Curso'
        )}
      </button>

      {message && (
        <div className={`form-message ${status === 'success' ? 'form-message-success' : 'form-message-error'}`}>
          {status === 'success' ? '✅' : '❌'} {message}
        </div>
      )}
    </form>
  )
}
