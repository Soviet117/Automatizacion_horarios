'use client'

import { useState } from 'react'

export default function AulaForm() {
  const [formData, setFormData] = useState({
    id_aula: '',
    nom_aula: '',
    id_tipo_aula: '',
    capacidad: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    // Imprimir en consola del navegador
    console.log('═══════════════════════════════════════')
    console.log('🏫 NUEVA AULA (Browser Console)')
    console.log('═══════════════════════════════════════')
    console.log('Datos enviados:', formData)
    console.log('═══════════════════════════════════════')

    try {
      const res = await fetch('/api/aulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        console.log('✅ Respuesta del servidor:', data)
        setStatus('success')
        setMessage('Aula registrada exitosamente (ver consola del servidor)')
        setFormData({
          id_aula: '',
          nom_aula: '',
          id_tipo_aula: '',
          capacidad: '',
        })
      } else {
        console.error('❌ Error:', data.error)
        setStatus('error')
        setMessage(data.error || 'Error al registrar aula')
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
        <span className="form-icon">🏫</span>
        <h3>Registrar Aula</h3>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="aula-id">ID Aula</label>
          <input
            id="aula-id"
            name="id_aula"
            type="text"
            placeholder="AUL-001"
            value={formData.id_aula}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="aula-nombre">Nombre del Aula</label>
          <input
            id="aula-nombre"
            name="nom_aula"
            type="text"
            placeholder="Laboratorio A"
            value={formData.nom_aula}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="aula-tipo">ID Tipo de Aula</label>
          <input
            id="aula-tipo"
            name="id_tipo_aula"
            type="text"
            placeholder="TIP-001"
            value={formData.id_tipo_aula}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="aula-capacidad">Capacidad</label>
          <input
            id="aula-capacidad"
            name="capacidad"
            type="number"
            placeholder="40"
            min="1"
            value={formData.capacidad}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <button type="submit" className="btn-submit" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <span className="btn-loading">⏳ Enviando...</span>
        ) : (
          '📤 Registrar Aula'
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
