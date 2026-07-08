'use client';

import { useState, useEffect } from 'react';
import { getDocentes, createDocente, updateDocente, deleteDocente, getCursos } from './actions';
import { Teacher, Course } from '../../../lib/types';
import { Users, Plus, Search, Edit2, Trash2, X, Clock, CheckCircle2, BrainCircuit } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const SLOTS = ['07:00-08:20', '08:30-10:00', '10:15-11:45', '12:00-13:30', '15:45-17:15', '17:30-19:00', '19:10-20:40', '20:50-22:20'];

const card: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' };

type ModalType = { open: boolean; type: 'teacher'; editId: string | null };

export default function RecursosPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalType>({ open: false, type: 'teacher', editId: null });
  const [tempAvail, setTempAvail] = useState<Record<number, number[]>>({});
  const [tempComp, setTempComp] = useState<string[]>([]);
  const [tempDni, setTempDni] = useState('');
  const [tempNombre, setTempNombre] = useState('');
  const [tempApellido, setTempApellido] = useState('');
  const [tempEspecialidad, setTempEspecialidad] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getDocentes().then(setTeachers);
    getCursos().then(setCourses);
  }, []);

  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const openTeacherModal = (editId: string | null = null) => {
    const t = editId ? teachers.find(x => x.id === editId) : null;
    setTempDni(t?.dni ?? '');
    setTempNombre(t?.nombre ?? '');
    setTempApellido(t?.apellido ?? '');
    setTempEspecialidad(t?.especialidad ?? '');
    setErrorMsg('');
    setTempEmail(t?.email ?? '');
    setTempAvail(t?.availability ?? {});
    setTempComp(t?.competencies ?? []);
    setModal({ open: true, type: 'teacher', editId });
  };

  const handleSaveTeacher = async () => {
    if (!tempDni || !tempNombre || !tempApellido || !tempEspecialidad) {
      setErrorMsg('Por favor llena DNI, Nombre, Apellido y Especialidad.');
      return;
    }
    setErrorMsg('');
    setIsSaving(true);
    try {
      const payload = {
        dni: tempDni,
        nombre: tempNombre,
        apellido: tempApellido,
        especialidad: tempEspecialidad,
        email: tempEmail,
        competencies: tempComp,
        availability: tempAvail
      };
      
      if (modal.editId) {
        await updateDocente(modal.editId, payload);
      } else {
        await createDocente(payload);
      }
      
      const updated = await getDocentes();
      setTeachers(updated);
      setModal({ ...modal, open: false });
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este docente?')) return;
    await deleteDocente(id);
    const updated = await getDocentes();
    setTeachers(updated);
  };

  const toggleAvail = (day: number, slot: number) => {
    setTempAvail(prev => {
      const d = [...(prev[day] ?? [])];
      const i = d.indexOf(slot);
      if (i >= 0) d.splice(i, 1); else d.push(slot);
      return { ...prev, [day]: d };
    });
  };

  const toggleRow = (slot: number) => {
    setTempAvail(prev => {
      const allOn = DAYS.every((_, di) => prev[di]?.includes(slot));
      if (allOn) {
        const next = { ...prev };
        DAYS.forEach((_, di) => {
          next[di] = (next[di] ?? []).filter(s => s !== slot);
        });
        return next;
      } else {
        const next = { ...prev };
        DAYS.forEach((_, di) => {
          const d = new Set(next[di] ?? []);
          d.add(slot);
          next[di] = [...d];
        });
        return next;
      }
    });
  };

  const toggleCol = (day: number) => {
    setTempAvail(prev => {
      const cur = new Set(prev[day] ?? []);
      const allOn = SLOTS.every((_, si) => cur.has(si));
      if (allOn) {
        return { ...prev, [day]: [] };
      } else {
        return { ...prev, [day]: SLOTS.map((_, si) => si) };
      }
    });
  };

  const toggleComp = (id: string) =>
    setTempComp(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const s = {
    label: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 } as React.CSSProperties,
    input: { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'var(--bg-card)' } as React.CSSProperties,
    btn: { padding: '9px 18px', background: 'var(--accent)', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
    btnGhost: { padding: '9px 18px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-card)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>Recursos Docentes</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Administra el cuerpo docente, sus competencias y disponibilidades horarias.</p>
        </div>
        <button
          onClick={() => openTeacherModal()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus style={{ width: 15, height: 15 }} />
          Nuevo Docente
        </button>
      </div>

      {/* Search & KPI summary */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 12, padding: 4, gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <Users style={{ width: 15, height: 15 }} />
            Docentes Registrados
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: '#0f172a', color: 'white' }}>
              {teachers.length}
            </span>
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Buscar docente..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid var(--border-color)', borderRadius: 10, fontSize: 13.5, color: 'var(--text-primary)', background: 'var(--bg-card)', outline: 'none', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Docentes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredTeachers.map(t => {
          const compNames = t.competencies.map(id => courses.find(c => c.id === id)?.name).filter(Boolean);
          const availDays = Object.values(t.availability ?? {}).filter(s => s.length > 0).length;
          return (
            <div key={t.id} style={{ ...card, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16, transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #475569, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#10b981' }}>Máx. {t.maxHours}h / semana</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openTeacherModal(t.id)}
                    style={{ padding: 7, border: 'none', background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}>
                    <Edit2 style={{ width: 13, height: 13 }} />
                  </button>
                  <button onClick={() => handleDeleteTeacher(t.id)} style={{ padding: 7, border: 'none', background: '#fef2f2', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#ef4444' }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, padding: '10px 0', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-light)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{availDays}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>días disponible</div>
                </div>
                <div style={{ flex: 1, padding: '10px 0', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-light)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{compNames.length}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>competencias</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BrainCircuit style={{ width: 13, height: 13 }} /> Puede dictar
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {compNames.length > 0 ? compNames.map(name => (
                    <span key={name} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#f0fdf4', color: '#10b981', border: '1px solid #a7f3d0' }}>{name}</span>
                  )) : <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin competencias asignadas</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Docente */}
      {modal.open && modal.type === 'teacher' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 680, borderRadius: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '88vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{modal.editId ? 'Editar Perfil Docente' : 'Nuevo Docente'}</h2>
              <button onClick={() => setModal({ ...modal, open: false })} style={{ padding: 6, border: 'none', background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {errorMsg && <div style={{ color: 'red', fontSize: 13, padding: '10px', background: '#fee2e2', borderRadius: 8 }}>{errorMsg}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={s.label}>DNI</label>
                  <input type="text" placeholder="Ej. 12345678" value={tempDni} onChange={e => setTempDni(e.target.value)} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Correo</label>
                  <input type="email" placeholder="docente@uni.edu" value={tempEmail} onChange={e => setTempEmail(e.target.value)} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Nombre</label>
                  <input type="text" placeholder="Ej. María" value={tempNombre} onChange={e => setTempNombre(e.target.value)} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Apellido</label>
                  <input type="text" placeholder="Ej. García" value={tempApellido} onChange={e => setTempApellido(e.target.value)} style={s.input} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={s.label}>Especialidad</label>
                  <input type="text" placeholder="Ej. Ingeniería de Software" value={tempEspecialidad} onChange={e => setTempEspecialidad(e.target.value)} style={s.input} />
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
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${on ? '#a7f3d0' : 'var(--border-color)'}`, background: on ? '#f0fdf4' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: on ? '#065f46' : 'var(--text-secondary)', textAlign: 'left', fontFamily: 'inherit' }}>
                        <CheckCircle2 style={{ width: 15, height: 15, color: on ? '#10b981' : 'var(--text-tertiary)', flexShrink: 0 }} />
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
                <div style={{ overflowX: 'auto', border: '1.5px solid var(--border-color)', borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Horario</th>
                        {DAYS.map(d => <th key={d} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>{d.slice(0, 3)}</th>)}
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {SLOTS.map((slot, si) => (
                        <tr key={slot} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 14px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{slot}</td>
                          {DAYS.map((_, di) => {
                            const on = tempAvail[di]?.includes(si);
                            return (
                              <td key={di} style={{ padding: '6px 8px', textAlign: 'center' }}>
                                <button type="button" onClick={() => toggleAvail(di, si)}
                                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: on ? '#10b981' : 'var(--bg-tertiary)', color: on ? 'white' : 'var(--text-tertiary)', transition: 'all 0.15s' }}>
                                  {on ? '✓' : ''}
                                </button>
                              </td>
                            );
                          })}
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            <button type="button" onClick={() => toggleRow(si)}
                              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: 12, background: 'var(--bg-card)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                              title="Seleccionar / deseleccionar toda la fila">
                              ⤓
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ padding: '6px 14px' }}></td>
                        {DAYS.map((_, di) => {
                          const allOn = SLOTS.every((_, si) => tempAvail[di]?.includes(si));
                          return (
                            <td key={di} style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <button type="button" onClick={() => toggleCol(di)}
                                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: 12, background: allOn ? '#10b981' : 'var(--bg-card)', color: allOn ? 'white' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                                title="Seleccionar / deseleccionar toda la columna">
                                ⤓
                              </button>
                            </td>
                          );
                        })}
                        <td style={{ padding: '6px 4px' }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
              <button onClick={() => setModal({ ...modal, open: false })} style={s.btnGhost}>Cancelar</button>
              <button onClick={handleSaveTeacher} disabled={isSaving} style={{ ...s.btn, opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
