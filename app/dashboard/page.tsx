'use client';

import { useState, useEffect } from 'react';
import { sampleCohorts, sampleTeachers, sampleClassrooms } from '../../lib/data';
import { Cohort, Teacher, Classroom } from '../../lib/types';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { Zap, AlertCircle, Users, Building2, BookOpen, ChevronDown, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

const card: React.CSSProperties = {
  background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const healthData = [
  { name: 'Lunes', materias: 100, ocupacion: 85 },
  { name: 'Martes', materias: 100, ocupacion: 92 },
  { name: 'Miércoles', materias: 100, ocupacion: 78 },
  { name: 'Jueves', materias: 100, ocupacion: 95 },
  { name: 'Viernes', materias: 100, ocupacion: 65 },
];

export default function DashboardPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [scenario, setScenario] = useState('Borrador Actual (V3)');

  useEffect(() => {
    setCohorts(sampleCohorts());
    setTeachers(sampleTeachers());
    setClassrooms(sampleClassrooms());
  }, []);

  const totalStudents = cohorts.reduce((a, c) => a + c.students, 0);
  const totalCapacity = classrooms.reduce((a, c) => a + c.capacity, 0);
  const demandRatio = totalCapacity > 0 ? Math.round((totalStudents / (totalCapacity * 25)) * 100) : 0;
  const teacherHours = teachers.reduce((a, t) => a + t.maxHours, 0);
  const requiredHours = cohorts.reduce((a, c) => a + c.requiredCourses.reduce((s, r) => s + r.hours, 0), 0);
  const teacherLoad = teacherHours > 0 ? Math.round((requiredHours / teacherHours) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0 }}>Dashboard Ejecutivo</h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0', fontWeight: 400 }}>Resumen general y métricas de salud del escenario seleccionado.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={{
              appearance: 'none', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10,
              padding: '9px 36px 9px 14px', fontSize: 13.5, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <option>Borrador Actual (V3)</option>
              <option>Semestre 2026-I (Publicado)</option>
              <option>Simulación de Crecimiento (+20%)</option>
            </select>
            <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
          <Link href="/dashboard/horarios" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white',
            padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <Zap style={{ width: 15, height: 15, color: '#10b981' }} />
            Lanzar CSP
          </Link>
        </div>
      </div>

      {/* ── Alerts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { icon: AlertCircle, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', title: 'Conflicto Crítico de Aula', desc: "Cohorte 'Ing. Sistemas A' excede capacidad de Laboratorio 1." },
          { icon: Clock, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', title: 'Disponibilidad Limitada', desc: 'El Dr. García solo tiene 2 horas libres restantes este ciclo.' },
          { icon: CheckCircle2, color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0', title: 'Validación CSP Aprobada', desc: 'El borrador actual es matemáticamente viable y sin conflictos.' },
        ].map(({ icon: Icon, color, bg, border, title, desc }) => (
          <div key={title} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Icon style={{ width: 18, height: 18, color, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {/* Cohortes */}
        <div style={{ ...card, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: '#eef2ff', borderRadius: '50%', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cohortes Activas</span>
              <div style={{ padding: 10, background: '#eef2ff', borderRadius: 10 }}><Users style={{ width: 18, height: 18, color: '#6366f1' }} /></div>
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: 6 }}>{cohorts.length}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Agrupando <strong style={{ color: '#6366f1' }}>{totalStudents}</strong> alumnos</div>
          </div>
        </div>

        {/* Demanda de Aulas */}
        <div style={{ ...card, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: '#f0fdf4', borderRadius: '50%', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demanda de Aulas</span>
              <div style={{ padding: 10, background: '#f0fdf4', borderRadius: 10 }}><Building2 style={{ width: 18, height: 18, color: '#10b981' }} /></div>
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: 10 }}>{demandRatio}%</div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${Math.min(100, demandRatio)}%`, background: demandRatio > 80 ? '#ef4444' : '#10b981', borderRadius: 99, transition: 'width 1s' }} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: demandRatio > 100 ? '#ef4444' : '#10b981' }}>
              {demandRatio > 100 ? '⚠ Faltan aulas físicas' : '✓ Capacidad instalada suficiente'}
            </div>
          </div>
        </div>

        {/* Ocupación Docente */}
        <div style={{ ...card, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: '#eff6ff', borderRadius: '50%', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ocupación Docente</span>
              <div style={{ padding: 10, background: '#eff6ff', borderRadius: 10 }}><BookOpen style={{ width: 18, height: 18, color: '#3b82f6' }} /></div>
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: 10 }}>{teacherLoad}%</div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${Math.min(100, teacherLoad)}%`, background: teacherLoad > 90 ? '#f59e0b' : '#3b82f6', borderRadius: 99, transition: 'width 1s' }} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: teacherLoad > 100 ? '#f59e0b' : '#3b82f6' }}>
              {teacherLoad > 100 ? '⚠ Faltan docentes disponibles' : '✓ Carga de horas equilibrada'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Health Check Chart ── */}
      <div style={{ ...card, padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Health Check de Programación</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>Ocupación de infraestructura y cobertura de materias por día de la semana.</p>
          </div>
          <div style={{ display: 'flex', gap: 18, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#0f172a', display: 'inline-block' }} />Materias
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#10b981', display: 'inline-block' }} />Ocupación
            </span>
          </div>
        </div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={healthData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={6} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
              <RechartsTooltip
                cursor={{ fill: '#f8fafc', radius: 6 }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,.08)', fontSize: 13 }}
              />
              <Bar dataKey="materias" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={36} name="Materias" />
              <Bar dataKey="ocupacion" radius={[6, 6, 0, 0]} maxBarSize={36} name="Ocupación">
                {healthData.map((e, i) => <Cell key={i} fill={e.ocupacion > 90 ? '#ef4444' : '#10b981'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
