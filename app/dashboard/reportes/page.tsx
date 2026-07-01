'use client';

import {
  BarChart2, Download, FileText, TrendingUp, Users,
  Building2, BookOpen, Clock, ChevronDown, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend
} from 'recharts';
import { useState, useEffect, useRef } from 'react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function ReportesPage() {
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPeriodos() {
      try {
        const res = await fetch('/api/master-data');
        if (res.ok) {
          const json = await res.json();
          if (json.periodos && json.periodos.length > 0) {
            setPeriodos(json.periodos);
            const active = json.periodos.find((p: any) => p.activo) || json.periodos[0];
            setSelectedPeriodo(active.id_periodo);
          }
        }
      } catch (error) {
        console.error("Error fetching periodos:", error);
      }
    }
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (!selectedPeriodo) return;
    
    async function fetchReportData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reportes?periodo=${selectedPeriodo}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, [selectedPeriodo]);

  const handleExportPDF = () => {
    // html2canvas y jsPDF tienen problemas serios renderizando gráficos SVG de Recharts 
    // dentro de contenedores responsivos en Next.js.
    // La mejor solución y más limpia es utilizar la API nativa de impresión del navegador
    // con estilos @media print que ocultan todo lo demás (sidebar, nav, etc).
    window.print();
  };

  if (!data && !loading && !selectedPeriodo) {
      return <div className="p-8 text-center text-slate-500">No hay periodos disponibles para analizar.</div>;
  }

  const { roomUsageData = [], teacherLoadData = [], weeklyData = [], programData = [], stats = {} } = data || {};

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto print-area" ref={reportRef}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reportes y Analíticas</h1>
          <p className="text-sm text-slate-500 mt-1">Métricas de uso de infraestructura, carga docente y distribución académica.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative no-print">
            <select 
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              disabled={loading}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-4 pr-8 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {periodos.map((p) => (
                <option key={p.id_periodo} value={p.id_periodo}>{p.nom_periodo}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={loading || !data}
            className="no-print inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-emerald-500" />
          <p className="font-medium">Calculando métricas...</p>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Utilización Media de Aulas', value: `${stats.utilizacionMedia || 0}%`, trend: 'Semestre Actual', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Carga Docente Promedio', value: `${stats.cargaDocenteMedia || 0}h`, trend: 'Semestre Actual', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Materias Cubiertos', value: `${stats.materiasCubiertos || 0}%`, trend: 'Estimado', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Sesiones Asignadas', value: `${stats.horasAsignadas || 0}`, trend: 'Bloques de tiempo', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(kpi => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all">
                  <div className={`p-2 ${kpi.bg} rounded-xl inline-block mb-3`}><Icon className={`h-5 w-5 ${kpi.color}`} /></div>
                  <div className="text-2xl font-extrabold text-slate-900 mb-0.5">{kpi.value}</div>
                  <div className="text-xs text-slate-500 mb-1">{kpi.label}</div>
                  <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {kpi.trend}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Uso de Aulas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">Utilización de Aulas (Top 10)</h3>
              <p className="text-xs text-slate-500 mb-4">Porcentaje de ocupación sobre 75 bloques semanales.</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roomUsageData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip formatter={(v: any) => [`${v}%`, 'Ocupación']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                    <Bar dataKey="usage" radius={[0, 6, 6, 0]} maxBarSize={20}>
                      {roomUsageData.map((e: any, i: number) => <Cell key={i} fill={e.usage > 85 ? '#ef4444' : e.usage > 70 ? '#f59e0b' : '#10b981'} />)}
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
                        {programData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v}%`, 'Alumnos']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto max-h-full pr-2">
                  {programData.map((p: any, i: number) => (
                    <div key={p.name} className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-slate-600 font-medium truncate" title={p.name}>{p.name}</span>
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
              <h3 className="font-bold text-slate-900 mb-1">Carga Horaria Docente (Top 10)</h3>
              <p className="text-xs text-slate-500 mb-4">Bloques asignados vs 40 bloques base.</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherLoadData} margin={{ left: -25, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="max" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={30} name="Base 40h" />
                    <Bar dataKey="assigned" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={30} name="Asignado">
                      {teacherLoadData.map((e: any, i: number) => <Cell key={i} fill={e.assigned >= e.max ? '#ef4444' : '#0f172a'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tendencia semanal */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">Ocupación por Día</h3>
              <p className="text-xs text-slate-500 mb-4">Cantidad de aulas y docentes activos por día.</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ left: -25, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`${v}`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                    <Legend iconType="circle" iconSize={8} />
                    <Line type="monotone" dataKey="aulas" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }} name="Aulas Activas" />
                    <Line type="monotone" dataKey="docentes" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} name="Docentes Activos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Estilos para ocultar el Sidebar y la UI general durante la exportación a PDF */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          /* Mostrar solo el contenedor del reporte */
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          /* Ocultar botones que no deberían salir en el PDF */
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
