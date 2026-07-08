'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Zap, AlertCircle, Users, Building2, BookOpen, ChevronDown, CheckCircle2,
  Clock, TrendingUp, CalendarDays, ArrowUpRight, ArrowDownRight,
  Layers, BarChart3, Sparkles, GraduationCap, Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ApiCurso {
  id_curso: string;
  nom_curso: string;
  creditos: number;
  alumnos: number;
  horas_teoricas: number;
  horas_practicas: number;
  modalidad: string;
  tipo_curso: string;
  id_ciclo: number;
  carrera?: { nom_carrera: string };
  ciclo?: { nom_ciclo: string };
  docente?: { nom_docente: string; ape_docente: string } | null;
}

interface ApiDocente {
  id_docente: string;
  nom_docente: string;
  ape_docente: string;
  nom_especialidad: string;
}

interface ApiAula {
  id_aula: string;
  nom_aula: string;
  capacidad: number;
  tipo_aula?: { nom_tipo_aula: string };
}

interface ApiSesion {
  id_horario: string;
  id_curso: string;
  dia: string;
  tipo_sesion: string;
  curso?: { nom_curso: string };
  aula?: { nom_aula: string };
  docente?: { nom_docente: string; ape_docente: string };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
        padding: '22px 28px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        minWidth: 200,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', letterSpacing: '0.03em' }}>
          {label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0' }}>
            <div style={{
              width: 14, height: 14, borderRadius: 5,
              background: entry.color,
              boxShadow: `0 4px 12px ${entry.color}44`,
            }} />
            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>{entry.name}</span>
            <span style={{ color: 'white', fontSize: 18, fontWeight: 800, marginLeft: 'auto' }}>
              {entry.value}{entry.name === 'Ocupación' ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
      overflow: 'hidden', height,
    }}>
      <div className="skeleton-shimmer" style={{ height: '100%' }} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<ApiCurso[]>([]);
  const [docentes, setDocentes] = useState<ApiDocente[]>([]);
  const [aulas, setAulas] = useState<ApiAula[]>([]);
  const [sesiones, setSesiones] = useState<ApiSesion[]>([]);
  const [scenario, setScenario] = useState('Borrador Actual (V3)');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(async () => {
    const u = user?.id ?? '';
    const query = u ? `?userId=${u}` : '';
    try {
      const [cursosRes, docentesRes, aulasRes, horariosRes] = await Promise.allSettled([
        fetch(`/api/cursos${query}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/docentes${query}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/aulas${query}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/horarios${query}`).then(r => r.ok ? r.json() : []),
      ]);
      if (cursosRes.status === 'fulfilled') setCursos(cursosRes.value);
      if (docentesRes.status === 'fulfilled') setDocentes(docentesRes.value);
      if (aulasRes.status === 'fulfilled') setAulas(aulasRes.value);
      if (horariosRes.status === 'fulfilled') setSesiones(horariosRes.value);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    setTimeout(() => setMounted(true), 50);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalAlumnos = useMemo(() => cursos.reduce((a, c) => a + (c.alumnos || 0), 0), [cursos]);
  const totalCapacidadAulas = useMemo(() => aulas.reduce((a, al) => a + (al.capacidad || 0), 0), [aulas]);
  const demandRatio = totalCapacidadAulas > 0
    ? Math.round((totalAlumnos / totalCapacidadAulas) * 100) : 0;
  const totalHorasRequeridas = useMemo(() =>
    cursos.reduce((a, c) => a + (c.horas_teoricas || 0) + (c.horas_practicas || 0), 0), [cursos]);
  const totalCreditos = useMemo(() => cursos.reduce((a, c) => a + (c.creditos || 0), 0), [cursos]);
  const totalSesiones = sesiones.length;
  const totalAsignacionesActivas = useMemo(() => {
    return new Set(sesiones.map(s => s.id_curso)).size;
  }, [sesiones]);

  const docentesSinAsignar = useMemo(() => {
    const docentesEnSesiones = new Set(sesiones.map(s => s.docente ? `${s.docente.nom_docente} ${s.docente.ape_docente}` : null).filter(Boolean));
    return docentes.filter(d => !docentesEnSesiones.has(`${d.nom_docente} ${d.ape_docente}`)).length;
  }, [docentes, sesiones]);
  const pctDocentesLibres = docentes.length > 0 ? Math.round((docentesSinAsignar / docentes.length) * 100) : 0;

  const teacherLoad = docentes.length > 0 ? Math.min(100, Math.round((totalSesiones / docentes.length) / 10 * 100)) : 0;

  const topCursos = useMemo(() => {
    return [...cursos].sort((a, b) => (b.alumnos || 0) - (a.alumnos || 0)).slice(0, 5);
  }, [cursos]);

  const healthData = useMemo(() => {
    const dayCounts: Record<string, number> = { Lun: 0, Mar: 0, Mie: 0, Jue: 0, Vie: 0 };
    sesiones.forEach(s => {
      const key = s.dia?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 3);
      if (key && dayCounts[key] !== undefined) dayCounts[key]++;
    });
    return Object.entries(dayCounts).map(([name, count]) => ({
      name,
      sesiones: count,
      ocupacion: count > 0 ? Math.min(100, Math.round((count / Math.max(aulas.length * 5, 1)) * 100)) : 0,
    }));
  }, [sesiones, aulas.length]);

  const aulaData = useMemo(() => {
    const aulaSessionCount: Record<string, number> = {};
    sesiones.forEach(s => {
      const name = s.aula?.nom_aula || 'Sin aula';
      aulaSessionCount[name] = (aulaSessionCount[name] || 0) + 1;
    });
    const maxSessions = Math.max(...Object.values(aulaSessionCount), 1);
    return Object.entries(aulaSessionCount)
      .map(([name, count]) => ({
        name,
        sesiones: count,
        pct: Math.round((count / maxSessions) * 100),
      }))
      .sort((a, b) => b.sesiones - a.sesiones);
  }, [sesiones]);

  const timeAgo = useMemo(() => {
    if (!lastUpdate) return '';
    const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (diff < 10) return 'ahora mismo';
    if (diff < 60) return `hace ${diff}s`;
    return `hace ${Math.floor(diff / 60)}m`;
  }, [lastUpdate, mounted]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
        <div style={{ height: 160, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', borderRadius: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} height={160} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
          {[1,2].map(i => <SkeletonCard key={i} height={180} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
          <SkeletonCard height={380} />
          <SkeletonCard height={380} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-card { animation: fadeUp 0.5s ease-out both; }
        .dash-card:nth-child(1) { animation-delay: 0s; }
        .dash-card:nth-child(2) { animation-delay: 0.07s; }
        .dash-card:nth-child(3) { animation-delay: 0.14s; }
        .dash-card:nth-child(4) { animation-delay: 0.21s; }
        .stat-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06) !important; }
        .stat-hover { transition: all 0.25s ease; cursor: default; }
      `}</style>

      {/* ── HERO HEADER ── */}
      <div className="dash-card" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        borderRadius: 20, padding: '32px 36px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.3)',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '30%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
              }}>
                <BarChart3 style={{ width: 20, height: 20, color: 'white' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Panel de Control</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', margin: 0, lineHeight: 1.2 }}>
              Dashboard Ejecutivo
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <select value={scenario} onChange={e => setScenario(e.target.value)} style={{
                appearance: 'none', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '10px 36px 10px 14px', fontSize: 14, fontWeight: 600,
                color: 'white', cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)',
              }}>
                <option value="actual" style={{ background: '#1e293b', color: 'white' }}>Borrador Actual (V3)</option>
                <option value="publicado" style={{ background: '#1e293b', color: 'white' }}>Semestre 2026-I (Publicado)</option>
                <option value="simulacion" style={{ background: '#1e293b', color: 'white' }}>Simulación de Crecimiento (+20%)</option>
              </select>
              <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
            </div>
            <Link href="/dashboard/horarios" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
              transition: 'all 0.2s',
            }}>
              <Zap style={{ width: 15, height: 15 }} />
              Lanzar CSP
            </Link>
          </div>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {demandRatio > 100 && (
        <div className="dash-card" style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
          border: '1.5px solid #fecaca', borderRadius: 16, padding: '18px 24px',
          display: 'flex', gap: 16, alignItems: 'center',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.08)',
          animationDelay: '0.1s',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertCircle style={{ width: 20, height: 20, color: '#ef4444' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 2 }}>Demanda de Aulas Excedida</div>
            <div style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.5 }}>
              La demanda actual ({demandRatio}%) supera la capacidad instalada. Se requieren más aulas o reducir la carga académica.
            </div>
          </div>
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {[
          { label: 'Cursos', value: cursos.length, sub: `${totalCreditos} créditos`, icon: BookOpen, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', shadowColor: 'rgba(99,102,241,0.3)', trend: '+2', trendUp: true },
          { label: 'Docentes', value: docentes.length, sub: `${totalSesiones} sesiones`, icon: Users, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadowColor: 'rgba(16,185,129,0.3)', trend: '+1', trendUp: true },
          { label: 'Aulas', value: aulas.length, sub: `${totalCapacidadAulas} capacidad`, icon: Building2, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadowColor: 'rgba(59,130,246,0.3)', trend: '0', trendUp: true },
          { label: 'Alumnos', value: totalAlumnos, sub: `${totalHorasRequeridas}h curriculares`, icon: GraduationCap, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadowColor: 'rgba(245,158,11,0.3)', trend: '+15', trendUp: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`dash-card stat-hover`} style={{
              background: 'white', borderRadius: 16, padding: 0,
              border: '1px solid #e2e8f0', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
            }}>
              <div style={{ padding: '22px 24px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: stat.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 8px 20px ${stat.shadowColor}`,
                  }}>
                    <Icon style={{ width: 20, height: 20, color: 'white' }} />
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    background: stat.trendUp ? '#f0fdf4' : '#fef2f2',
                    padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    color: stat.trendUp ? '#16a34a' : '#dc2626',
                  }}>
                    {stat.trendUp ? <ArrowUpRight style={{ width: 12, height: 12 }} /> : <ArrowDownRight style={{ width: 12, height: 12 }} />}
                    {stat.trend}
                  </div>
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: 6, letterSpacing: '-1px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>{stat.label}</div>
              </div>
              <div style={{
                padding: '10px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9',
                fontSize: 14, color: '#94a3b8', fontWeight: 500,
              }}>
                {stat.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PROGRESS CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {/* Demanda de Aulas */}
        <div className="dash-card stat-hover" style={{
          background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
        }}>
          <div style={{ padding: '24px 28px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Demanda de Aulas
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-1.5px' }}>{demandRatio}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>%</span>
              </div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: demandRatio > 80 ? 'linear-gradient(135deg, #fef2f2, #fee2e2)' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 style={{ width: 24, height: 24, color: demandRatio > 80 ? '#ef4444' : '#10b981' }} />
            </div>
          </div>
          <div style={{ padding: '0 28px 24px' }}>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%', width: `${Math.min(100, demandRatio)}%`,
                background: demandRatio > 80 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: demandRatio > 100 ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                {demandRatio > 100 ? <AlertCircle style={{ width: 14, height: 14 }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
                {demandRatio > 100 ? 'Faltan aulas físicas' : 'Capacidad instalada suficiente'}
              </span>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>{totalAlumnos} alumnos / {totalCapacidadAulas} capacidad</span>
            </div>
          </div>
        </div>

        {/* Carga Docente */}
        <div className="dash-card stat-hover" style={{
          background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
        }}>
          <div style={{ padding: '24px 28px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Carga Docente
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-1.5px' }}>{teacherLoad}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>%</span>
              </div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp style={{ width: 24, height: 24, color: '#3b82f6' }} />
            </div>
          </div>
          <div style={{ padding: '0 28px 24px' }}>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%', width: `${Math.min(100, teacherLoad)}%`,
                background: teacherLoad > 80 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                {docentes.length > 0 ? `Promedio ${Math.round(totalSesiones / docentes.length)} ses/docente` : 'Sin docentes'}
              </span>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>{totalSesiones} sesiones / {docentes.length} docentes</span>
            </div>
          </div>
        </div>

        {/* Docentes sin Asignar */}
        <div className="dash-card stat-hover" style={{
          background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
        }}>
          <div style={{ padding: '24px 28px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Docentes sin Asignar
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-1.5px' }}>{docentesSinAsignar}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>/{docentes.length}</span>
              </div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: docentesSinAsignar === 0 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users style={{ width: 24, height: 24, color: docentesSinAsignar === 0 ? '#10b981' : '#ef4444' }} />
            </div>
          </div>
          <div style={{ padding: '0 28px 24px' }}>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%', width: `${100 - pctDocentesLibres}%`,
                background: docentesSinAsignar === 0 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: docentesSinAsignar === 0 ? '#16a34a' : '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                {docentesSinAsignar === 0 ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <AlertCircle style={{ width: 14, height: 14 }} />}
                {docentesSinAsignar === 0 ? 'Todos los docentes asignados' : 'Hay docentes disponibles'}
              </span>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>{docentes.length - docentesSinAsignar} asignados / {docentes.length} total</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Chart + Table ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

        {/* Health Check Chart */}
        <div className="dash-card" style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 20, border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 12px 32px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '28px 32px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  }}>
                    <BarChart3 style={{ width: 18, height: 18, color: 'white' }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                    Distribución Semanal
                  </h3>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 2, marginLeft: 46 }}>Sesiones y ocupación por día</p>
              </div>
              <div style={{ display: 'flex', gap: 18, fontSize: 13, fontWeight: 600, background: '#f1f5f9', padding: '8px 16px', borderRadius: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#6366f1' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 4, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'inline-block' }} />Sesiones
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#10b981' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 4, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'inline-block' }} />Ocupación
                </span>
              </div>
            </div>
          </div>
          {totalSesiones === 0 ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays style={{ width: 28, height: 28, color: '#cbd5e1' }} />
              </div>
              <p style={{ fontSize: 15, color: '#64748b', fontWeight: 600, margin: 0 }}>No hay sesiones programadas</p>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Genera un horario desde Escenarios o Gestor de Horarios</p>
            </div>
          ) : (
            <div style={{ padding: '0 16px 24px', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthData} margin={{ top: 12, right: 20, left: -12, bottom: 0 }} barGap={10} barCategoryGap="28%">
                  <defs>
                    <linearGradient id="gradSesiones" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="gradOcupBaja" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="gradOcupMedia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="gradOcupAlta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 14, fontWeight: 700 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 8 }} />
                  <Bar yAxisId="left" dataKey="sesiones" fill="url(#gradSesiones)" radius={[8, 8, 0, 0]} maxBarSize={32} name="Sesiones" barSize={22}
                    activeBar={{ fill: '#818cf8', filter: 'brightness(1.2) drop-shadow(0 4px 8px rgba(99,102,241,0.4))' }} />
                  <Bar yAxisId="right" dataKey="ocupacion" radius={[8, 8, 0, 0]} maxBarSize={32} name="Ocupación" barSize={22}
                    activeBar={{ fill: '#34d399', filter: 'brightness(1.2) drop-shadow(0 4px 8px rgba(16,185,129,0.4))' }}>
                    {healthData.map((entry, i) => (
                      <Cell key={i} fill={entry.ocupacion > 90 ? 'url(#gradOcupAlta)' : entry.ocupacion > 60 ? 'url(#gradOcupMedia)' : 'url(#gradOcupBaja)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column: Top Cursos */}
        <div className="dash-card" style={{
          background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '24px 28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
              }}>
                <GraduationCap style={{ width: 18, height: 18, color: 'white' }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                Top Cursos por Alumnos
              </h3>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4, marginLeft: 46 }}>Los 5 cursos con mayor matrícula</p>
          </div>
          <div style={{ padding: '20px 28px 24px' }}>
            {topCursos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <BookOpen style={{ width: 32, height: 32, margin: '0 auto 12px', color: '#cbd5e1' }} />
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No hay cursos registrados</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topCursos.map((curso, i) => {
                  const maxAlumnos = topCursos[0]?.alumnos || 1;
                  const pct = Math.round(((curso.alumnos || 0) / maxAlumnos) * 100);
                  const colors = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
                  return (
                    <div key={curso.id_curso}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: 7, background: colors[i],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0,
                          }}>{i + 1}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {curso.nom_curso}
                          </span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginLeft: 12 }}>{curso.alumnos}</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}88)`,
                          borderRadius: 99, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AULA OCCUPATION ── */}
      <div className="dash-card" style={{
        background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}>
              <Building2 style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Ocupación por Aula
            </h3>
          </div>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4, marginLeft: 46 }}>Sesiones asignadas por espacio</p>
        </div>
        <div style={{ padding: '20px 32px 28px' }}>
          {aulaData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <Building2 style={{ width: 32, height: 32, margin: '0 auto 12px', color: '#cbd5e1' }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No hay sesiones asignadas a aulas</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {aulaData.map((aula, i) => {
                const colors = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
                const color = colors[i % colors.length];
                return (
                  <div key={aula.name} style={{
                    background: '#f8fafc', borderRadius: 12, padding: '16px 20px',
                    border: '1px solid #f1f5f9',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{aula.name}</span>
                      <span title={`${aula.sesiones} sesiones`} style={{
                        fontSize: 13, fontWeight: 800, color: color,
                        background: `${color}15`, padding: '3px 10px', borderRadius: 6,
                        cursor: 'default', transition: 'all 0.2s',
                      }}>{aula.sesiones}</span>
                    </div>
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${aula.pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}88)`,
                        borderRadius: 99, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SUMMARY ROW ── */}
      <div className="dash-card" style={{
        background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
        padding: '28px 32px',
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 24px', letterSpacing: '-0.3px' }}>
          Resumen General
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { icon: Clock, color: '#6366f1', bg: '#eef2ff', label: 'Horas curriculares', value: `${totalHorasRequeridas}h` },
            { icon: CheckCircle2, color: '#10b981', bg: '#f0fdf4', label: 'Sesiones generadas', value: totalSesiones },
            { icon: Layers, color: '#3b82f6', bg: '#eff6ff', label: 'Asignaciones activas', value: totalAsignacionesActivas },
            { icon: Timer, color: '#f59e0b', bg: '#fffbeb', label: 'Total alumnos', value: totalAlumnos },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13, background: item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon style={{ width: 22, height: 22, color: item.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
