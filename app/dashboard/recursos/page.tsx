'use client';

import { useState, useEffect } from 'react';
import { sampleTeachers, sampleClassrooms, sampleCourses } from '../../../lib/data';
import { Teacher, Classroom, Course } from '../../../lib/types';
import { Users, Building2, Plus, Search, Edit2, Trash2, X, Clock, CheckCircle2, BrainCircuit } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const SLOTS = ['07:00-09:00', '09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'];
const ROOM_TYPES = [
  { value: 'classroom', label: 'Aula Teórica', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'computer-lab', label: 'Lab. Cómputo', color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'workshop', label: 'Taller', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'practical-lab', label: 'Lab. Práctico', color: '#10b981', bg: '#f0fdf4' },
];

const card: React.CSSProperties = { background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

type ModalType = { open: boolean; type: 'teacher' | 'classroom'; editId: string | null };

export default function RecursosPage() {
  const [activeTab, setActiveTab] = useState<'docentes' | 'aulas'>('docentes');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalType>({ open: false, type: 'teacher', editId: null });
  const [tempAvail, setTempAvail] = useState<Record<number, number[]>>({});
  const [tempComp, setTempComp] = useState<string[]>([]);

  useEffect(() => {
    setTeachers(sampleTeachers());
    setClassrooms(sampleClassrooms());
    setCourses(sampleCourses());
  }, []);

  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredClassrooms = classrooms.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const openTeacherModal = (editId: string | null = null) => {
    const t = editId ? teachers.find(x => x.id === editId) : null;
    setTempAvail(t?.availability ?? {});
    setTempComp(t?.competencies ?? []);
    setModal({ open: true, type: 'teacher', editId });
  };

  const toggleAvail = (day: number, slot: number) => {
    setTempAvail(prev => {
      const d = [...(prev[day] ?? [])];
      const i = d.indexOf(slot);
      if (i >= 0) d.splice(i, 1); else d.push(slot);
      return { ...prev, [day]: d };
    });
  };

  const toggleComp = (id: string) =>
    setTempComp(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const getRoomCfg = (type: string) => ROOM_TYPES.find(r => r.value === type) ?? ROOM_TYPES[0];

  const s = {
    label: { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 } as React.CSSProperties,
    input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as React.CSSProperties,
    btn: { padding: '9px 18px', background: '#0f172a', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
    btnGhost: { padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 13.5, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0 }}>Recursos e Infraestructura</h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>Administra el cuerpo docente, sus competencias y los espacios físicos disponibles.</p>
        </div>
        <button
          onClick={() => activeTab === 'docentes' ? openTeacherModal() : setModal({ open: true, type: 'classroom', editId: null })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus style={{ width: 15, height: 15 }} />
          {activeTab === 'docentes' ? 'Nuevo Docente' : 'Nueva Aula'}
        </button>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, gap: 2 }}>
          {(['docentes', 'aulas'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s', background: activeTab === tab ? 'white' : 'transparent', color: activeTab === tab ? '#0f172a' : '#64748b', boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {tab === 'docentes' ? <Users style={{ width: 15, height: 15 }} /> : <Building2 style={{ width: 15, height: 15 }} />}
              {tab === 'docentes' ? 'Docentes' : 'Aulas'}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: activeTab === tab ? '#0f172a' : '#e2e8f0', color: activeTab === tab ? 'white' : '#64748b' }}>
                {tab === 'docentes' ? teachers.length : classrooms.length}
              </span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13.5, color: '#334155', background: 'white', outline: 'none', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Docentes Grid */}
      {activeTab === 'docentes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredTeachers.map(t => {
            const compNames = t.competencies.map(id => courses.find(c => c.id === id)?.name).filter(Boolean);
            const availDays = Object.values(t.availability ?? {}).filter(s => s.length > 0).length;
            return (
              <div key={t.id} style={{ ...card, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16, transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #475569, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{t.name}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#10b981' }}>Máx. {t.maxHours}h / semana</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openTeacherModal(t.id)}
                      style={{ padding: 7, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#475569' }}>
                      <Edit2 style={{ width: 13, height: 13 }} />
                    </button>
                    <button style={{ padding: 7, border: 'none', background: '#fef2f2', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#ef4444' }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, padding: '10px 0', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{availDays}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>días disponible</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px 0', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{compNames.length}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>competencias</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <BrainCircuit style={{ width: 13, height: 13 }} /> Puede dictar
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {compNames.length > 0 ? compNames.map(name => (
                      <span key={name} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#f0fdf4', color: '#10b981', border: '1px solid #a7f3d0' }}>{name}</span>
                    )) : <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Sin competencias asignadas</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Aulas Grid */}
      {activeTab === 'aulas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredClassrooms.map(a => {
            const cfg = getRoomCfg(a.type);
            const pct = Math.floor(Math.random() * 40 + 50);
            return (
              <div key={a.id} style={{ ...card, padding: '22px 24px', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ padding: 10, background: '#eff6ff', borderRadius: 10 }}><Building2 style={{ width: 17, height: 17, color: '#3b82f6' }} /></div>
                  <button onClick={() => setModal({ open: true, type: 'classroom', editId: a.id })} style={{ padding: 7, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#475569' }}>
                    <Edit2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{a.name}</div>
                <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, marginBottom: 16 }}>{cfg.label}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}>
                  <span>Capacidad: <strong style={{ color: '#0f172a' }}>{a.capacity} pax</strong></span>
                  <span style={{ color: '#94a3b8' }}>Uso: {pct}%</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Docente */}
      {modal.open && modal.type === 'teacher' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 680, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '88vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{modal.editId ? 'Editar Perfil Docente' : 'Nuevo Docente'}</h2>
              <button onClick={() => setModal({ ...modal, open: false })} style={{ padding: 6, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#64748b' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={s.label}>Nombre Completo</label>
                  <input type="text" placeholder="Ej. Dr. María García" style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Correo</label>
                  <input type="email" placeholder="docente@uni.edu" style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Máx. Horas / Semana</label>
                  <input type="number" defaultValue={40} style={s.input} />
                </div>
              </div>

              {/* Competencias */}
              <div>
                <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BrainCircuit style={{ width: 14, height: 14, color: '#10b981' }} /> Competencias habilitadas
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {courses.map(c => {
                    const on = tempComp.includes(c.id);
                    return (
                      <button key={c.id} type="button" onClick={() => toggleComp(c.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${on ? '#a7f3d0' : '#e2e8f0'}`, background: on ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: on ? '#065f46' : '#475569', textAlign: 'left', fontFamily: 'inherit' }}>
                        <CheckCircle2 style={{ width: 15, height: 15, color: on ? '#10b981' : '#cbd5e1', flexShrink: 0 }} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Disponibilidad */}
              <div>
                <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock style={{ width: 14, height: 14, color: '#3b82f6' }} /> Disponibilidad Horaria
                </label>
                <div style={{ overflowX: 'auto', border: '1.5px solid #e2e8f0', borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Horario</th>
                        {DAYS.map(d => <th key={d} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{d.slice(0, 3)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {SLOTS.map((slot, si) => (
                        <tr key={slot} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 14px', color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>{slot}</td>
                          {DAYS.map((_, di) => {
                            const on = tempAvail[di]?.includes(si);
                            return (
                              <td key={di} style={{ padding: '6px 8px', textAlign: 'center' }}>
                                <button type="button" onClick={() => toggleAvail(di, si)}
                                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: on ? '#10b981' : '#f1f5f9', color: on ? 'white' : '#cbd5e1', transition: 'all 0.15s' }}>
                                  {on ? '✓' : ''}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12.5, color: '#92400e', fontWeight: 500 }}>
                ⚠ Funcionalidad de persistencia pendiente de integración con API.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
              <button onClick={() => setModal({ ...modal, open: false })} style={s.btnGhost}>Cancelar</button>
              <button onClick={() => setModal({ ...modal, open: false })} style={s.btn}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aula */}
      {modal.open && modal.type === 'classroom' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 480, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{modal.editId ? 'Editar Aula' : 'Nueva Aula'}</h2>
              <button onClick={() => setModal({ ...modal, open: false })} style={{ padding: 6, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#64748b' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={s.label}>Nombre / Código</label>
                <input type="text" placeholder="Ej. A-301" style={s.input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={s.label}>Capacidad (pax)</label>
                  <input type="number" defaultValue={30} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Tipo</label>
                  <select style={{ ...s.input }}>
                    {ROOM_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <button onClick={() => setModal({ ...modal, open: false })} style={s.btnGhost}>Cancelar</button>
              <button onClick={() => setModal({ ...modal, open: false })} style={s.btn}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
