'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock, Archive,
  GitBranch, AlertCircle, User, Home, BookOpen, RefreshCw, Edit3, X
} from 'lucide-react';
import { getAulas, updateSessionSlot } from './actions';
import { useToast } from '@/app/context/ToastContext';

// ── Types ──────────────────────────────────────────────────────────────────
interface Escenario {
  id: string;
  name: string;
  status: 'published' | 'draft' | 'simulation';
  createdAt: string;
  createdBy: string;
  coverage: number;
  conflicts: number;
  sessions: Session[];
}

interface Session {
  id: string;
  day: number;    // 0=Lunes … 4=Viernes
  slot: number;   // 0…7
  course: string;
  teacher: string;
  room: string;
  tipo: string;
  id_aula?: string; // needed for modal default value
}

interface Aula {
  id_aula: string;
  nom_aula: string;
  capacidad: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const FALLBACK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const FALLBACK_SLOTS = [
  { label: '07:00 – 08:20' },
  { label: '08:30 – 10:00' },
  { label: '10:15 – 11:45' },
  { label: '12:00 – 13:30' },
  { label: '15:45 – 17:15' },
  { label: '17:30 – 19:00' },
  { label: '19:10 – 20:40' },
  { label: '20:50 – 22:20' },
];

const STATUS_CFG = {
  published: { label: 'Publicado',    color: '#065f46', bg: '#f0fdf4', border: '#a7f3d0', Icon: CheckCircle2 },
  simulation: { label: 'Simulación', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', Icon: GitBranch },
  draft:      { label: 'Borrador',   color: '#92400e', bg: '#fffbeb', border: '#fde68a', Icon: Clock },
};

const COURSE_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#ec4899', '#f97316', '#6366f1',
];

// ── Card style helper ──────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 16,
  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
};

  // ── Main Component ─────────────────────────────────────────────────────────
export default function HorariosPage() {
  const { toast } = useToast();
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseColors, setCourseColors] = useState<Record<string, string>>({});
  const [DAYS, setDays] = useState(FALLBACK_DAYS);
  const [SLOTS, setSlots] = useState(FALLBACK_SLOTS);
  
  // Modal state
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editForm, setEditForm] = useState({ day: 0, slot: 0, roomId: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [res, aulasData, masterRes] = await Promise.all([
        fetch('/api/escenarios-con-sesiones'),
        getAulas(),
        fetch('/api/master-data').then(r => r.ok ? r.json() : null),
      ]);
      if (!res.ok) throw new Error('Error al cargar escenarios');
      const data: Escenario[] = await res.json();
      setEscenarios(data);
      setAulas(aulasData);
      if (masterRes?.dias) setDays(masterRes.dias.map((d: { nom_dia: string }) => d.nom_dia));
      if (masterRes?.bloques) setSlots(masterRes.bloques.map((b: { horario_inicio: string; horario_fin: string }) => ({ label: `${b.horario_inicio} – ${b.horario_fin}` })));

      // Assign stable colors to courses
      const allCourses = Array.from(new Set(data.flatMap(e => e.sessions.map(s => s.course))));
      const colorMap: Record<string, string> = {};
      allCourses.forEach((c, i) => { colorMap[c] = COURSE_COLORS[i % COURSE_COLORS.length]; });
      setCourseColors(colorMap);

      // Auto-select the published one, or first
      const pub = data.find(e => e.status === 'published');
      setSelected(pub?.id ?? data[0]?.id ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }

  const activeEscenario = escenarios.find(e => e.id === selected);

  // Build calendar grid: day × slot → session
  const grid: Record<string, Session> = {};
  activeEscenario?.sessions.forEach(s => {
    grid[`${s.day}-${s.slot}`] = s;
  });

  const handleEditClick = (sess: Session) => {
    if (activeEscenario?.status !== 'draft') return;
    
    // Encontramos el id_aula actual para pre-seleccionarlo
    const currentAula = aulas.find(a => a.nom_aula === sess.room)?.id_aula || '';
    
    setEditForm({ day: sess.day, slot: sess.slot, roomId: currentAula });
    setEditingSession(sess);
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;
    setIsSaving(true);
    try {
      await updateSessionSlot(editingSession.id, editForm.day, editForm.slot, editForm.roomId);
      await loadData();
      setEditingSession(null);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar style={{ width: 22, height: 22, color: '#6366f1' }} />
            Explorador de Horarios
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Visualiza el horario publicado. Selecciona un escenario del historial para comparar.
          </p>
        </div>
        <button onClick={loadData} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1.5px solid var(--border-color)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw style={{ width: 14, height: 14 }} /> Actualizar
        </button>
      </div>

      {loading && (
        <div style={{ ...card, padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando horarios…</div>
      )}
      {error && (
        <div style={{ ...card, padding: 20, color: '#ef4444', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle style={{ width: 16, height: 16 }} /> {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Historial de Versiones ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 4px' }}>
              Historial de versiones
            </div>
            {escenarios.length === 0 && (
              <div style={{ ...card, padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                No hay escenarios publicados aún.<br />Ve a <strong>Escenarios</strong> para crear uno.
              </div>
            )}
            {escenarios.map(e => {
              const cfg = STATUS_CFG[e.status] ?? STATUS_CFG.draft;
              const Icon = cfg.Icon;
              const isActive = selected === e.id;
              return (
                <button key={e.id} onClick={() => setSelected(e.id)} style={{
                  width: '100%', textAlign: 'left', background: 'var(--bg-card)',
                  border: `2px solid ${isActive ? '#6366f1' : 'var(--border-color)'}`,
                  borderRadius: 14, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.15)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{e.name}</div>
                    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 700 }}>
                      <Icon style={{ width: 10, height: 10 }} />{cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '6px 0 8px' }}>
                    {e.createdAt} · por {e.createdBy}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <span>Cobertura</span>
                    <span style={{ color: e.coverage === 100 ? '#10b981' : '#f59e0b' }}>{e.coverage}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${e.coverage}%`, background: e.coverage === 100 ? '#10b981' : '#f59e0b', borderRadius: 99 }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    📋 {e.sessions.length} sesiones asignadas
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Calendar View ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeEscenario ? (
              <>
                {/* Scenario KPIs */}
                <div style={{ ...card, padding: '16px 22px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{activeEscenario.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {STATUS_CFG[activeEscenario.status]?.label} · {activeEscenario.sessions.length} sesiones · Cobertura {activeEscenario.coverage}%
                    </div>
                  </div>
                  {activeEscenario.status === 'published' && (
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: 20, color: '#065f46', fontSize: 13, fontWeight: 700 }}>
                      <CheckCircle2 style={{ width: 14, height: 14 }} /> Horario Oficial
                    </span>
                  )}
                  {activeEscenario.status === 'draft' && (
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 20, color: '#1d4ed8', fontSize: 13, fontWeight: 700 }}>
                      <Edit3 style={{ width: 14, height: 14 }} /> Modo Edición Activo (Clic en curso para mover)
                    </span>
                  )}
                </div>

                {/* Calendar Grid */}
                {activeEscenario.sessions.length === 0 ? (
                  <div style={{ ...card, padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <Calendar style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Este escenario no tiene sesiones</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Ve a <strong>Escenarios</strong> y usa "Re-optimizar (CSP)" para generar el horario.</div>
                  </div>
                ) : (
                  <div style={{ ...card, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', border: '1px solid var(--border-light)', minWidth: 110 }}>Bloque</th>
                          {DAYS.map(d => (
                            <th key={d} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SLOTS.map((sl, slotIdx) => (
                          <tr key={slotIdx}>
                            <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>
                              {sl.label}
                            </td>
                            {DAYS.map((_, dayIdx) => {
                              const sess = grid[`${dayIdx}-${slotIdx}`];
                              const color = sess ? (courseColors[sess.course] ?? '#6366f1') : null;
                              return (
                                <td key={dayIdx} style={{ padding: 6, border: '1px solid var(--border-light)', verticalAlign: 'top', minWidth: 140 }}>
                                  {sess ? (
                                    <div 
                                      onClick={() => handleEditClick(sess)}
                                      style={{ 
                                        background: color + '15', 
                                        border: `1.5px solid ${color}40`, 
                                        borderLeft: `4px solid ${color}`, 
                                        borderRadius: 8, 
                                        padding: '8px 10px',
                                        cursor: activeEscenario.status === 'draft' ? 'pointer' : 'default',
                                        transition: 'transform 0.1s',
                                      }}
                                      onMouseEnter={(e) => activeEscenario.status === 'draft' && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                                      onMouseLeave={(e) => activeEscenario.status === 'draft' && (e.currentTarget.style.transform = 'none', e.currentTarget.style.boxShadow = 'none')}
                                    >
                                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{sess.course}</div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                                        <User style={{ width: 10, height: 10 }} /> {sess.teacher}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        <Home style={{ width: 10, height: 10 }} /> {sess.room}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ height: 60, borderRadius: 8, background: 'var(--bg-secondary)' }} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Legend */}
                {activeEscenario.sessions.length > 0 && (
                  <div style={{ ...card, padding: '14px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Cursos:</span>
                    {Array.from(new Set(activeEscenario.sessions.map(s => s.course))).map(course => (
                      <span key={course} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-primary)' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: courseColors[course] ?? '#6366f1', flexShrink: 0 }} />
                        {course}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ ...card, padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <Calendar style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 15, fontWeight: 600 }}>Selecciona un escenario del historial</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingSession && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 450, borderRadius: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Mover Sesión</h2>
              <button onClick={() => setEditingSession(null)} style={{ padding: 6, border: 'none', background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><X style={{ width: 15, height: 15 }} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{editingSession.course}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 12 }}>
                  <span><User style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-2px' }} /> {editingSession.teacher}</span>
                  <span><Clock style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-2px' }} /> {editingSession.tipo}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Día de la semana</label>
                <select value={editForm.day} onChange={e => setEditForm(prev => ({ ...prev, day: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Bloque Horario</label>
                <select value={editForm.slot} onChange={e => setEditForm(prev => ({ ...prev, slot: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}>
                  {SLOTS.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Aula</label>
                <select value={editForm.roomId} onChange={e => setEditForm(prev => ({ ...prev, roomId: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}>
                  {aulas.map(a => <option key={a.id_aula} value={a.id_aula}>{a.nom_aula} (Cap: {a.capacidad})</option>)}
                </select>
              </div>

            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
              <button onClick={() => setEditingSession(null)} disabled={isSaving} style={{ padding: '9px 18px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-card)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={handleSaveEdit} disabled={isSaving || !editForm.roomId} style={{ padding: '9px 18px', background: '#0f172a', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit', opacity: (isSaving || !editForm.roomId) ? 0.7 : 1 }}>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
