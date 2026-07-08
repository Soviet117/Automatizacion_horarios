'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, BookOpen, Clock, Users, Layers, Edit2, Trash2, GraduationCap, Building2, Settings } from 'lucide-react';
import MateriaModal from '../../../components/MateriaModal';
import AsignarDocenteModal from '../../../components/AsignarDocenteModal';

interface Curso {
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
  id_plan: string | null;
  carrera: { id_carrera: string; nom_carrera: string };
  ciclo: { id_ciclo: number; nom_ciclo: string };
  tipo_sesion: { id_tipo_sesion: string; nom_tipo_sesion: string };
  plan: { id_plan: string; nom_plan: string } | null;
}

export default function GestionCurricularPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [maestros, setMaestros] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCursoAssign, setSelectedCursoAssign] = useState<any>(null);

  useEffect(() => {
    fetchMaestros();
    fetchCursos();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = cursos.filter(c => 
      c.nom_curso.toLowerCase().includes(term) || 
      c.id_curso.toLowerCase().includes(term) ||
      c.carrera.nom_carrera.toLowerCase().includes(term)
    );
    setFilteredCursos(filtered);
  }, [searchTerm, cursos]);

  const fetchMaestros = async () => {
    try {
      const res = await fetch('/api/maestros');
      if (res.ok) {
        const data = await res.json();
        setMaestros(data);
      }
    } catch (err) {
      console.error("Error fetching maestros:", err);
    }
  };

  const fetchCursos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gestion-curricular');
      if (res.ok) {
        const data = await res.json();
        setCursos(data);
      }
    } catch (err) {
      console.error("Error fetching cursos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (curso?: any) => {
    setSelectedCurso(curso || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCurso(null);
  };

  const handleSaveModal = () => {
    setIsModalOpen(false);
    fetchCursos();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la materia ${id}?`)) return;

    try {
      const res = await fetch(`/api/gestion-curricular?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCursos();
      } else {
        alert("Error al eliminar la materia");
      }
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Gestión Curricular
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
            Administra las materias, su carga académica y la cohorte de alumnos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard/gestion-curricular/catalogos')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 14,
            background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <Settings style={{ width: 18, height: 18 }} /> Catálogos
          </button>
          <button onClick={() => handleOpenModal()} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)'; }}>
            <Plus style={{ width: 18, height: 18 }} /> Nueva Materia
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ 
        display: 'flex', gap: 16, marginBottom: 24, padding: 20, 
        background: 'var(--bg-card)', borderRadius: 20, boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-light)' 
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', width: 18, height: 18 }} />
          <input 
            type="text" 
            placeholder="Buscar por código, nombre o carrera..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, border: '1.5px solid var(--border-color)',
              background: 'var(--bg-secondary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', color: 'var(--text-primary)'
            }}
            onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'var(--bg-card)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.background = 'var(--bg-secondary)'; }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ padding: '8px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen style={{ width: 16, height: 16, color: '#16a34a' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{filteredCursos.length} Materias</span>
          </div>
          <div style={{ padding: '8px 16px', background: '#fdf2f8', borderRadius: 12, border: '1px solid #fce7f3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users style={{ width: 16, height: 16, color: '#db2777' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#be185d' }}>
              {filteredCursos.reduce((acc, curr) => acc + (curr.alumnos || 0), 0)} Alumnos Totales
            </span>
          </div>
        </div>
      </div>

      {/* Grid view */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: '4px solid var(--border-color)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          {filteredCursos.map(curso => (
            <div key={curso.id_curso} style={{
              background: 'var(--bg-card)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.05em' }}>
                    {curso.id_curso}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{curso.nom_curso}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
                    <GraduationCap style={{ width: 14, height: 14 }} /> {curso.carrera?.nom_carrera}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setSelectedCursoAssign(curso); setIsAssignModalOpen(true); }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-secondary)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ecfdf5'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }} title="Asignar Docente">
                    <Users style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={() => handleOpenModal(curso)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-secondary)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
                    <Edit2 style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={() => handleDelete(curso.id_curso)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-secondary)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 0', borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers style={{ width: 16, height: 16, color: '#16a34a' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Nivel</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{curso.ciclo?.nom_ciclo}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 16, height: 16, color: '#db2777' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Cohorte</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{curso.alumnos} alumnos</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock style={{ width: 16, height: 16, color: '#2563eb' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Carga</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{curso.creditos} CRD ({curso.horas_teoricas}T / {curso.horas_practicas}P)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 style={{ width: 16, height: 16, color: '#d97706' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Modalidad</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{curso.modalidad}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 8 }}>
                  {curso.tipo_sesion?.nom_tipo_sesion}
                </div>
                {curso.plan && (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Plan: {curso.plan.nom_plan}
                  </div>
                )}
              </div>

            </div>
          ))}
          {filteredCursos.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 20, border: '1px dashed var(--border-color)' }}>
              <BookOpen style={{ width: 48, height: 48, color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-secondary)' }}>No se encontraron materias</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 14 }}>Intenta ajustar tu búsqueda o registra una nueva materia.</p>
            </div>
          )}
        </div>
      )}

      <MateriaModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
        materia={selectedCurso}
        maestros={maestros}
      />

      {/* Asignar Docente Modal */}
      <AsignarDocenteModal
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setSelectedCursoAssign(null); }}
        curso={selectedCursoAssign}
      />

    </div>
  );
}
