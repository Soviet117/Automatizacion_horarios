'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Trash2, Plus, UserPlus } from 'lucide-react';

interface AsignarDocenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  curso: any | null;
}

export default function AsignarDocenteModal({ isOpen, onClose, curso }: AsignarDocenteModalProps) {
  const [docentes, setDocentes] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [selectedDocente, setSelectedDocente] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !curso) return;
    setSelectedDocente('');
    setError(null);
    fetchDocentes();
    fetchAsignaciones();
  }, [isOpen, curso?.id_curso]);

  const fetchDocentes = async () => {
    try {
      const res = await fetch('/api/docentes');
      if (res.ok) {
        const data = await res.json();
        setDocentes(data);
      }
    } catch (err) {
      console.error('Error cargando docentes:', err);
    }
  };

  const fetchAsignaciones = async () => {
    try {
      if (!curso) return;
      const res = await fetch(`/api/asignaciones?id_curso=${curso.id_curso}`);
      if (res.ok) {
        const data = await res.json();
        setAsignaciones(data);
      }
    } catch (err) {
      console.error('Error cargando asignaciones:', err);
    }
  };

  const handleAssign = async () => {
    if (!selectedDocente) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/asignaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_curso: curso.id_curso, id_docente: selectedDocente })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al asignar');
      await fetchAsignaciones();
      setSelectedDocente('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_asignacion: string) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/asignaciones?id=${encodeURIComponent(id_asignacion)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await fetchAsignaciones();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !curso) return null;

  // Solo mostramos docentes que tengan el curso habilitado en sus competencias
  const docentesHabilitados = docentes.filter(d =>
    Array.isArray(d.competencias) && d.competencias.includes(curso.id_curso)
  );

  // IDs ya asignados para evitar duplicados en el select
  const asignadosIds = new Set(asignaciones.map((a: any) => a.id_docente));
  const docentesDisponibles = docentesHabilitados.filter(d => !asignadosIds.has(d.id_docente));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200,
      padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 24, width: '100%', maxWidth: 520,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderBottom: '1px solid #bfdbfe',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
            }}>
              <UserPlus style={{ color: 'white', width: 22, height: 22 }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e3a8a' }}>
                Asignar Docente
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
                {curso.id_curso} · {curso.nom_curso}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)', color: '#64748b'
          }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {error && (
            <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Selector de docente */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              Docente a asignar (Semestre Activo)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={selectedDocente}
                onChange={e => setSelectedDocente(e.target.value)}
                style={{
                  flex: 1, padding: '10px 14px',
                  background: docentesDisponibles.length === 0 ? '#f1f5f9' : '#f8fafc',
                  border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14,
                  color: '#0f172a', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="">Seleccione un docente...</option>
                {docentesDisponibles.map(d => (
                  <option key={d.id_docente} value={d.id_docente}>
                    {d.nom_docente} {d.ape_docente} — {d.nom_especialidad}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedDocente || loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px',
                  borderRadius: 12, background: (!selectedDocente || loading) ? '#e2e8f0' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none', color: (!selectedDocente || loading) ? '#94a3b8' : 'white',
                  fontSize: 14, fontWeight: 600, cursor: (!selectedDocente || loading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                {loading ? '...' : 'Añadir'}
              </button>
            </div>

            {/* Avisos */}
            {docentesHabilitados.length === 0 && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px' }}>
                ⚠️ Ningún docente tiene la <strong>competencia</strong> habilitada para este curso.
                Ve a <strong>Recursos → Editar docente → Competencias</strong> y marca este curso.
              </p>
            )}
            {docentesHabilitados.length > 0 && docentesDisponibles.length === 0 && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#059669', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
                ✅ Todos los docentes habilitados ya están asignados a este curso.
              </p>
            )}
          </div>

          {/* Lista de asignaciones actuales */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              <Users style={{ width: 14, height: 14, color: '#64748b' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                Asignados este semestre ({asignaciones.length})
              </span>
            </div>

            {asignaciones.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                <Users style={{ width: 28, height: 28, color: '#cbd5e1', margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                  Aún no hay docentes asignados a este curso.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {asignaciones.map((asig: any) => (
                  <div key={asig.id_asignacion} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', borderRadius: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: '#dbeafe',
                        color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14
                      }}>
                        {asig.docente?.nom_docente?.[0]}{asig.docente?.ape_docente?.[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                          {asig.docente?.nom_docente} {asig.docente?.ape_docente}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                          {asig.id_asignacion}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(asig.id_asignacion)}
                      disabled={loading}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: '#fee2e2', color: '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0
                      }}
                      title="Eliminar asignación"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
