'use client';

import { useState, useEffect } from 'react';
import { sampleCourses, sampleCohorts } from '../../../lib/data';
import { Course, Cohort } from '../../../lib/types';
import { BookOpen, Users, Plus, Search, Edit2, Trash2, X, Clock, GraduationCap } from 'lucide-react';

const card: React.CSSProperties = {
  background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};
const PROGRAMS = ['Ingeniería de Sistemas', 'Enfermería', 'Electrónica', 'Administración'];
const COURSE_TYPES = [
  { value: 'theoretical', label: 'Teórico', color: '#64748b', bg: '#f1f5f9' },
  { value: 'programming', label: 'Programación', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'electronics', label: 'Electrónica', color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'nursing', label: 'Enfermería', color: '#10b981', bg: '#f0fdf4' },
];

export default function CatalogoPage() {
  const [activeTab, setActiveTab] = useState<'materias' | 'cohortes'>('materias');
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; type: 'course' | 'cohort'; editId: string | null }>({ open: false, type: 'course', editId: null });

  useEffect(() => { setCourses(sampleCourses()); setCohorts(sampleCohorts()); }, []);

  const filtered = activeTab === 'materias'
    ? courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.program.toLowerCase().includes(search.toLowerCase()))
    : cohorts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const getTypeCfg = (type: string) => COURSE_TYPES.find(t => t.value === type) ?? COURSE_TYPES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0 }}>Catálogo Académico</h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>Gestión de malla curricular, materias y grupos de estudiantes (cohortes).</p>
        </div>
        <button onClick={() => setModal({ open: true, type: activeTab === 'materias' ? 'course' : 'cohort', editId: null })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontFamily: 'inherit' }}>
          <Plus style={{ width: 15, height: 15 }} />
          {activeTab === 'materias' ? 'Nueva Materia' : 'Nueva Cohorte'}
        </button>
      </div>

      {/* Tab + Search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, gap: 2 }}>
          {(['materias', 'cohortes'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s',
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#0f172a' : '#64748b',
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab === 'materias' ? <BookOpen style={{ width: 15, height: 15 }} /> : <Users style={{ width: 15, height: 15 }} />}
              {tab === 'materias' ? 'Materias' : 'Cohortes'}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: activeTab === tab ? '#0f172a' : '#e2e8f0', color: activeTab === tab ? 'white' : '#64748b' }}>
                {tab === 'materias' ? courses.length : cohorts.length}
              </span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
          <input type="text" placeholder={`Buscar ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13.5, color: '#334155', background: 'white', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* Materias Grid */}
      {activeTab === 'materias' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {(filtered as Course[]).map(c => {
            const cfg = getTypeCfg(c.type);
            return (
              <div key={c.id} style={{ ...card, padding: '20px 22px', cursor: 'default', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#cbd5e1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ padding: 10, background: '#eff6ff', borderRadius: 10 }}>
                    <BookOpen style={{ width: 17, height: 17, color: '#3b82f6' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, opacity: 0 }} className="card-actions"
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                    <button onClick={() => setModal({ open: true, type: 'course', editId: c.id })}
                      style={{ padding: 7, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit2 style={{ width: 13, height: 13 }} />
                    </button>
                    <button style={{ padding: 7, border: 'none', background: '#fef2f2', borderRadius: 8, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>{c.program}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}>Sem. {c.semester}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 11, height: 11 }} />{c.theoreticalHours + c.practicalHours}h
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.bg}` }}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <BookOpen style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontWeight: 600 }}>No se encontraron materias</div>
            </div>
          )}
        </div>
      )}

      {/* Cohortes Grid */}
      {activeTab === 'cohortes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {(filtered as Cohort[]).map(coh => (
            <div key={coh.id} style={{ ...card, padding: '20px 22px', transition: 'box-shadow 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ padding: 10, background: '#f5f3ff', borderRadius: 10 }}><GraduationCap style={{ width: 17, height: 17, color: '#8b5cf6' }} /></div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{coh.name}</div>
                    <div style={{ fontSize: 12.5, color: '#64748b' }}>{coh.program} — Sem. {coh.semester}</div>
                  </div>
                </div>
                <button onClick={() => setModal({ open: true, type: 'cohort', editId: coh.id })}
                  style={{ padding: 7, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Edit2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{coh.students}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>Alumnos</div>
                </div>
                <div style={{ flex: 1, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{coh.requiredCourses.length}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>Materias</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {coh.requiredCourses.map(req => {
                  const name = courses.find(c => c.id === req.courseId)?.name;
                  return <span key={req.courseId} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #e9d5ff' }}>{name} ({req.hours}h)</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 520, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {modal.editId ? 'Editar' : 'Crear'} {modal.type === 'course' ? 'Materia' : 'Cohorte'}
              </h2>
              <button onClick={() => setModal({ ...modal, open: false })} style={{ padding: 6, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Nombre</label>
                <input type="text" placeholder={modal.type === 'course' ? 'Ej. Algoritmos y Estructuras de Datos' : 'Ej. CS-A 2026'}
                  style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Programa</label>
                  <select style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white', fontFamily: 'inherit', outline: 'none' }}>
                    {PROGRAMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Semestre</label>
                  <input type="number" defaultValue={1} min={1} max={12} style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12.5, color: '#92400e', fontWeight: 500 }}>
                ⚠ Funcionalidad de persistencia pendiente de integración con API.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <button onClick={() => setModal({ ...modal, open: false })} style={{ padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 13.5, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={() => setModal({ ...modal, open: false })} style={{ padding: '9px 18px', background: '#0f172a', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
