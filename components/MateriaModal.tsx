import React, { useState, useEffect } from 'react';
import { X, Book, Users, Clock, Layers, HelpCircle } from 'lucide-react';

interface Materia {
  id_curso: string;
  nom_curso: string;
  creditos: number;
  horas_teoricas: number;
  horas_practicas: number;
  alumnos: number;
  modalidad: string;
  tipo_curso: string;
  id_carrera: string;
  id_ciclo: number;
  id_plan?: string | null;
}

interface MaestroData {
  carreras: { id_carrera: string; nom_carrera: string }[];
  ciclos: { id_ciclo: number; nom_ciclo: string }[];
  tiposSesion: { id_tipo_sesion: string; nom_tipo_sesion: string }[];
  planesEstudio: { id_plan: string; nom_plan: string; id_carrera: string }[];
}

interface MateriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  materia?: Materia | null;
  maestros: MaestroData | null;
}

export default function MateriaModal({ isOpen, onClose, onSave, materia, maestros }: MateriaModalProps) {
  const [formData, setFormData] = useState<Partial<Materia>>({
    id_curso: '',
    nom_curso: '',
    creditos: 0,
    horas_teoricas: 0,
    horas_practicas: 0,
    alumnos: 0,
    modalidad: 'Presencial',
    tipo_curso: '',
    id_carrera: '',
    id_ciclo: 1,
    id_plan: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (materia) {
      setFormData(materia);
    } else {
      setFormData({
        id_curso: '',
        nom_curso: '',
        creditos: 0,
        horas_teoricas: 0,
        horas_practicas: 0,
        alumnos: 0,
        modalidad: 'Presencial',
        tipo_curso: maestros?.tiposSesion?.[0]?.id_tipo_sesion || '',
        id_carrera: maestros?.carreras?.[0]?.id_carrera || '',
        id_ciclo: maestros?.ciclos?.[0]?.id_ciclo || 1,
        id_plan: ''
      });
    }
    setError(null);
  }, [materia, isOpen, maestros]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = '/api/gestion-curricular';
      const method = materia ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ocurrió un error al guardar');
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activePlanes = maestros?.planesEstudio?.filter(p => p.id_carrera === formData.id_carrera) || [];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50,
      padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 24, width: '100%', maxWidth: 700,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
            }}>
              <Book style={{ color: 'white', width: 24, height: 24 }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {materia ? 'Editar Materia' : 'Nueva Materia'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Configura los detalles de la materia y su cohorte
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: '#64748b', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.transform = 'scale(1)'; }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, background: '#ffffff' }}>
          {error && (
            <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#ef4444', marginBottom: 24, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form id="materia-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            
            {/* General Info */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Layers style={{ width: 16, height: 16, color: '#10b981' }} /> Información General
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Código Materia *</label>
                  <input required name="id_curso" value={formData.id_curso} onChange={handleChange} disabled={!!materia}
                    style={{ width: '100%', padding: '12px 16px', background: materia ? '#f1f5f9' : '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none', transition: 'all 0.2s' }}
                    placeholder="Ej. MAT101" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Nombre de la Materia *</label>
                  <input required name="nom_curso" value={formData.nom_curso} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none', transition: 'all 0.2s' }}
                    placeholder="Ej. Cálculo I" />
                </div>
              </div>
            </div>

            {/* Academic Structure */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Book style={{ width: 16, height: 16, color: '#3b82f6' }} /> Estructura Académica
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Carrera *</label>
                  <select required name="id_carrera" value={formData.id_carrera} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Seleccione...</option>
                    {maestros?.carreras?.map(c => <option key={c.id_carrera} value={c.id_carrera}>{c.nom_carrera}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Plan de Estudio</label>
                  <select name="id_plan" value={formData.id_plan || ''} onChange={handleChange} disabled={!formData.id_carrera}
                    style={{ width: '100%', padding: '12px 16px', background: !formData.id_carrera ? '#f1f5f9' : '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Ninguno</option>
                    {activePlanes.map(p => <option key={p.id_plan} value={p.id_plan}>{p.nom_plan}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Ciclo/Nivel *</label>
                  <select required name="id_ciclo" value={formData.id_ciclo} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none', cursor: 'pointer' }}>
                    {maestros?.ciclos?.map(c => <option key={c.id_ciclo} value={c.id_ciclo}>{c.nom_ciclo}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Configuración de Carga y Cohortes */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Clock style={{ width: 16, height: 16, color: '#8b5cf6' }} /> Carga Horaria y Cohorte
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Créditos *</label>
                  <input type="number" required min="1" name="creditos" value={formData.creditos} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Horas Teóricas</label>
                  <input type="number" min="0" name="horas_teoricas" value={formData.horas_teoricas} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Horas Prácticas</label>
                  <input type="number" min="0" name="horas_practicas" value={formData.horas_practicas} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none' }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users style={{ width: 14, height: 14, color: '#ec4899' }} /> Alumnos
                  </label>
                  <input type="number" min="0" required name="alumnos" value={formData.alumnos} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: 12, fontSize: 14, color: '#831843', outline: 'none', fontWeight: 600 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Tipo de Sesión *</label>
                  <select required name="tipo_curso" value={formData.tipo_curso} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Seleccione...</option>
                    {maestros?.tiposSesion?.map(ts => <option key={ts.id_tipo_sesion} value={ts.id_tipo_sesion}>{ts.nom_tipo_sesion}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Modalidad *</label>
                  <select required name="modalidad" value={formData.modalidad} onChange={handleChange}
                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none', cursor: 'pointer' }}>
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Hibrida">Híbrida</option>
                  </select>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'flex-end', gap: 12
        }}>
          <button type="button" onClick={onClose} disabled={loading} style={{
            padding: '12px 24px', borderRadius: 12, background: 'white', border: '1.5px solid #e2e8f0',
            fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            Cancelar
          </button>
          <button type="submit" form="materia-form" disabled={loading} style={{
            padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Guardando...' : materia ? 'Guardar Cambios' : 'Crear Materia'}
          </button>
        </div>
      </div>
    </div>
  );
}
