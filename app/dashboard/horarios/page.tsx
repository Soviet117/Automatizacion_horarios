'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock, Archive,
  GitBranch, AlertCircle, User, Home, BookOpen, RefreshCw
} from 'lucide-react';

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
  slot: number;   // 0…4
  course: string;
  teacher: string;
  room: string;
  tipo: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const SLOTS = [
  { label: '07:00 – 09:00' },
  { label: '09:00 – 11:00' },
  { label: '11:00 – 13:00' },
  { label: '14:00 – 16:00' },
  { label: '16:00 – 18:00' },
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
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function HorariosPage() {
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseColors, setCourseColors] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/escenarios-con-sesiones');
      if (!res.ok) throw new Error('Error al cargar escenarios');
      const data: Escenario[] = await res.json();
      setEscenarios(data);

      // Assign stable colors to courses
      const allCourses = Array.from(new Set(data.flatMap(e => e.sessions.map(s => s.course))));
      const colorMap: Record<string, string> = {};
      allCourses.forEach((c, i) => { colorMap[c] = COURSE_COLORS[i % COURSE_COLORS.length]; });
      setCourseColors(colorMap);

      // Auto-select the published one, or first
      const pub = data.find(e => e.status === 'published');
      setSelected(pub?.id ?? data[0]?.id ?? null);
    } catch (e: any) {
      setError(e.message);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar style={{ width: 22, height: 22, color: '#6366f1' }} />
            Explorador de Horarios
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>
            Visualiza el horario publicado. Selecciona un escenario del historial para comparar.
          </p>
        </div>
        <button onClick={loadData} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f8fafc', color: '#475569', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw style={{ width: 14, height: 14 }} /> Actualizar
        </button>
      </div>

      {loading && (
        <div style={{ ...card, padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando horarios…</div>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 4px' }}>
              Historial de versiones
            </div>
            {escenarios.length === 0 && (
              <div style={{ ...card, padding: 20, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                No hay escenarios publicados aún.<br />Ve a <strong>Escenarios</strong> para crear uno.
              </div>
            )}
            {escenarios.map(e => {
              const cfg = STATUS_CFG[e.status] ?? STATUS_CFG.draft;
              const Icon = cfg.Icon;
              const isActive = selected === e.id;
              return (
                <button key={e.id} onClick={() => setSelected(e.id)} style={{
                  width: '100%', textAlign: 'left', background: 'white',
                  border: `2px solid ${isActive ? '#6366f1' : '#e2e8f0'}`,
                  borderRadius: 14, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{e.name}</div>
                    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 700 }}>
                      <Icon style={{ width: 10, height: 10 }} />{cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 8px' }}>
                    {e.createdAt} · por {e.createdBy}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    <span>Cobertura</span>
                    <span style={{ color: e.coverage === 100 ? '#10b981' : '#f59e0b' }}>{e.coverage}%</span>
                  </div>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${e.coverage}%`, background: e.coverage === 100 ? '#10b981' : '#f59e0b', borderRadius: 99 }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
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
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{activeEscenario.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                      {STATUS_CFG[activeEscenario.status]?.label} · {activeEscenario.sessions.length} sesiones · Cobertura {activeEscenario.coverage}%
                    </div>
                  </div>
                  {activeEscenario.status === 'published' && (
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: 20, color: '#065f46', fontSize: 13, fontWeight: 700 }}>
                      <CheckCircle2 style={{ width: 14, height: 14 }} /> Horario Oficial
                    </span>
                  )}
                </div>

                {/* Calendar Grid */}
                {activeEscenario.sessions.length === 0 ? (
                  <div style={{ ...card, padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                    <Calendar style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Este escenario no tiene sesiones</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Ve a <strong>Escenarios</strong> y usa "Re-optimizar (CSP)" para generar el horario.</div>
                  </div>
                ) : (
                  <div style={{ ...card, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', border: '1px solid #f1f5f9', minWidth: 110 }}>Bloque</th>
                          {DAYS.map(d => (
                            <th key={d} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#0f172a', border: '1px solid #f1f5f9' }}>{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SLOTS.map((sl, slotIdx) => (
                          <tr key={slotIdx}>
                            <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', border: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                              {sl.label}
                            </td>
                            {DAYS.map((_, dayIdx) => {
                              const sess = grid[`${dayIdx}-${slotIdx}`];
                              const color = sess ? (courseColors[sess.course] ?? '#6366f1') : null;
                              return (
                                <td key={dayIdx} style={{ padding: 6, border: '1px solid #f1f5f9', verticalAlign: 'top', minWidth: 140 }}>
                                  {sess ? (
                                    <div style={{ background: color + '15', border: `1.5px solid ${color}40`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '8px 10px' }}>
                                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{sess.course}</div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
                                        <User style={{ width: 10, height: 10 }} /> {sess.teacher}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569', marginTop: 2 }}>
                                        <Home style={{ width: 10, height: 10 }} /> {sess.room}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ height: 60, borderRadius: 8, background: '#fafafa' }} />
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
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Cursos:</span>
                    {Array.from(new Set(activeEscenario.sessions.map(s => s.course))).map(course => (
                      <span key={course} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: courseColors[course] ?? '#6366f1', flexShrink: 0 }} />
                        {course}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ ...card, padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <Calendar style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 15, fontWeight: 600 }}>Selecciona un escenario del historial</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
