'use client';

import {
  BarChart2, Download, FileText, TrendingUp, Users,
  Building2, BookOpen, Clock, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const roomUsageData = [
  { name: 'Aula A-101', usage: 92, capacity: 40 },
  { name: 'Lab Cómputo B', usage: 78, capacity: 30 },
  { name: 'Taller Eléc.', usage: 65, capacity: 25 },
  { name: 'Aula A-201', usage: 88, capacity: 45 },
  { name: 'Lab Práctico', usage: 45, capacity: 20 },
];

const teacherLoadData = [
  { name: 'Dr. García', assigned: 38, max: 40 },
  { name: 'Lic. Ramírez', assigned: 28, max: 35 },
  { name: 'Ing. Torres', assigned: 40, max: 40 },
  { name: 'Dr. Mendoza', assigned: 22, max: 30 },
  { name: 'Mtra. López', assigned: 32, max: 35 },
];

const weeklyData = [
  { day: 'Lun', aulas: 85, docentes: 90 },
  { day: 'Mar', aulas: 92, docentes: 95 },
  { day: 'Mié', aulas: 78, docentes: 80 },
  { day: 'Jue', aulas: 88, docentes: 85 },
  { day: 'Vie', aulas: 65, docentes: 70 },
];

const programData = [
  { name: 'Ing. Sistemas', value: 35 },
  { name: 'Enfermería', value: 28 },
  { name: 'Electrónica', value: 20 },
  { name: 'Administración', value: 17 },
];

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reportes y Analíticas</h1>
          <p className="text-sm text-slate-500 mt-1">Métricas de uso de infraestructura, carga docente y distribución académica.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-4 pr-8 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer">
              <option>Semestre 2026-I</option>
              <option>Semestre 2025-II</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Utilización Media de Aulas', value: '73.6%', trend: '+5%', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Carga Docente Promedio', value: '32h', trend: '-2h', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Materias Cubiertos', value: '94%', trend: '+3%', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Horas Asignadas / Sem.', value: '840h', trend: '+12h', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all">
              <div className={`p-2 ${kpi.bg} rounded-xl inline-block mb-3`}><Icon className={`h-5 w-5 ${kpi.color}`} /></div>
              <div className="text-2xl font-extrabold text-slate-900 mb-0.5">{kpi.value}</div>
              <div className="text-xs text-slate-500 mb-1">{kpi.label}</div>
              <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {kpi.trend} vs semestre anterior
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uso de Aulas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-1">Utilización de Aulas</h3>
          <p className="text-xs text-slate-500 mb-4">Porcentaje de ocupación promedio semanal.</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomUsageData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Ocupación']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                <Bar dataKey="usage" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {roomUsageData.map((e, i) => <Cell key={i} fill={e.usage > 85 ? '#ef4444' : e.usage > 70 ? '#f59e0b' : '#10b981'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por Programa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-1">Distribución por Programa</h3>
          <p className="text-xs text-slate-500 mb-4">Porcentaje de alumnos activos por carrera.</p>
          <div className="flex items-center gap-4 h-60">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={programData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {programData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {programData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-600 font-medium">{p.name}</span>
                  <span className="text-xs font-bold text-slate-900 ml-auto pl-2">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carga Docente */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-1">Carga Horaria Docente</h3>
          <p className="text-xs text-slate-500 mb-4">Horas asignadas vs máximo permitido.</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teacherLoadData} margin={{ left: -25, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="max" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={30} name="Máximo" />
                <Bar dataKey="assigned" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={30} name="Asignado">
                  {teacherLoadData.map((e, i) => <Cell key={i} fill={e.assigned >= e.max ? '#ef4444' : '#0f172a'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencia semanal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-1">Ocupación por Día</h3>
          <p className="text-xs text-slate-500 mb-4">Comparativa de ocupación de aulas vs docentes.</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ left: -25, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="aulas" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }} name="Aulas" />
                <Line type="monotone" dataKey="docentes" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} name="Docentes" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
