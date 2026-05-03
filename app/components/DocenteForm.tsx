'use client'

import { useState } from 'react'

export default function DocenteForm() {
  const [formData, setFormData] = useState({
    id_docente: '',
    dni_docente: '',
    nom_docente: '',
    ape_docente: '',
    nom_especialidad: '',
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
    console.log('📋 NUEVO DOCENTE (Browser Console)')
    console.log('═══════════════════════════════════════')
    console.log('Datos enviados:', formData)
    console.log('═══════════════════════════════════════')

    try {
      const res = await fetch('/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        console.log('✅ Respuesta del servidor:', data)
        setStatus('success')
        setMessage('Docente registrado exitosamente (ver consola del servidor)')
        setFormData({
          id_docente: '',
          dni_docente: '',
          nom_docente: '',
          ape_docente: '',
          nom_especialidad: '',
        })
      } else {
        console.error('❌ Error:', data.error)
        setStatus('error')
        setMessage(data.error || 'Error al registrar docente')
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
        <span className="form-icon">👨‍🏫</span>
        <h3>Registrar Docente</h3>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="docente-id">ID Docente</label>
          <input
            id="docente-id"
            name="id_docente"
            type="text"
            placeholder="DOC-001"
            value={formData.id_docente}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="docente-dni">DNI</label>
          <input
            id="docente-dni"
            name="dni_docente"
            type="text"
            placeholder="12345678"
            value={formData.dni_docente}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="docente-nombre">Nombre</label>
          <input
            id="docente-nombre"
            name="nom_docente"
            type="text"
            placeholder="Juan"
            value={formData.nom_docente}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="docente-apellido">Apellido</label>
          <input
            id="docente-apellido"
            name="ape_docente"
            type="text"
            placeholder="Pérez"
            value={formData.ape_docente}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group form-group-full">
          <label htmlFor="docente-especialidad">Especialidad</label>
          <input
            id="docente-especialidad"
            name="nom_especialidad"
            type="text"
            placeholder="Ingeniería de Software"
            value={formData.nom_especialidad}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <button type="submit" className="btn-submit" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <span className="btn-loading">⏳ Enviando...</span>
        ) : (
          '📤 Registrar Docente'
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
