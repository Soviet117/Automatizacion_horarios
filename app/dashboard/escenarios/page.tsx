'use client';

import { useState } from 'react';
import {
  Layers, Plus, Copy, Trash2, CheckCircle2, Clock, Archive,
  ArrowRight, MoreHorizontal, ChevronDown, X, GitBranch, Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';

type ScenarioStatus = 'published' | 'draft' | 'simulation';

interface Scenario {
  id: string;
  name: string;
  status: ScenarioStatus;
  createdAt: string;
  createdBy: string;
  conflicts: number;
  coverage: number;
  description: string;
}

const MOCK_SCENARIOS: Scenario[] = [
  { id: 's1', name: 'Semestre 2026-I (Publicado)', status: 'published', createdAt: '2026-05-15', createdBy: 'Admin', conflicts: 0, coverage: 100, description: 'Versión oficial aprobada por Coordinación Académica.' },
  { id: 's2', name: 'Borrador 2026-I v3', status: 'draft', createdAt: '2026-05-28', createdBy: 'Soviet', conflicts: 2, coverage: 87, description: 'Ajuste de horarios de laboratorio de electrónica.' },
  { id: 's3', name: 'Simulación: Crecimiento +20%', status: 'simulation', createdAt: '2026-05-29', createdBy: 'Soviet', conflicts: 5, coverage: 72, description: 'Prueba de capacidad ante un incremento del 20% en matrícula.' },
];

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; icon: React.ElementType; class: string; dot: string }> = {
  published: { label: 'Publicado', icon: CheckCircle2, class: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  draft: { label: 'Borrador', icon: Clock, class: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  simulation: { label: 'Simulación', icon: GitBranch, class: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

export default function EscenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>(MOCK_SCENARIOS);
  const [selected, setSelected] = useState<string | null>(MOCK_SCENARIOS[0].id);
  const [modal, setModal] = useState(false);

  const selectedScenario = scenarios.find(s => s.id === selected);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Escenarios</h1>
          <p className="text-sm text-slate-500 mt-1">Controla versiones de horarios, borradores, simulaciones y publicaciones.</p>
        </div>
        <button onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Nuevo Escenario
        </button>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario List */}
        <div className="flex flex-col gap-3">
          {scenarios.map(s => {
            const cfg = STATUS_CONFIG[s.status];
            const Icon = cfg.icon;
            return (
              <button key={s.id} onClick={() => setSelected(s.id)}
                className={cn("w-full text-left bg-white border rounded-2xl p-4 transition-all hover:shadow-md",
                  selected === s.id ? "border-slate-900 shadow-md ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300"
                )}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-slate-900 text-sm leading-tight">{s.name}</span>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap", cfg.class)}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{s.createdAt}</span>
                  <span>por {s.createdBy}</span>
                  {s.conflicts > 0 && <span className="text-red-500 font-semibold">{s.conflicts} conflictos</span>}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Cobertura</span><span>{s.coverage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", s.coverage === 100 ? "bg-emerald-500" : s.coverage > 75 ? "bg-amber-400" : "bg-red-400")}
                      style={{ width: `${s.coverage}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selectedScenario && (() => {
          const cfg = STATUS_CONFIG[selectedScenario.status];
          const Icon = cfg.icon;
          return (
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedScenario.name}</h2>
                    <p className="text-sm text-slate-500">{selectedScenario.description}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border", cfg.class)}>
                    <Icon className="h-4 w-4" /> {cfg.label}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col gap-6 flex-1">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Cobertura', value: `${selectedScenario.coverage}%`, color: selectedScenario.coverage === 100 ? 'text-emerald-600' : 'text-amber-600' },
                    { label: 'Conflictos', value: selectedScenario.conflicts, color: selectedScenario.conflicts === 0 ? 'text-emerald-600' : 'text-red-600' },
                    { label: 'Última edición', value: selectedScenario.createdAt, color: 'text-slate-800' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                      <div className={cn("text-2xl font-extrabold mb-0.5", stat.color)}>{stat.value}</div>
                      <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2.5">
                  <h3 className="font-semibold text-slate-700 text-sm">Acciones disponibles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all text-sm font-semibold text-slate-700">
                      <div className="p-1.5 bg-blue-50 rounded-lg"><Copy className="h-4 w-4 text-blue-600" /></div>
                      Duplicar escenario
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all text-sm font-semibold text-slate-700">
                      <div className="p-1.5 bg-purple-50 rounded-lg"><Zap className="h-4 w-4 text-purple-600" /></div>
                      Re-optimizar (CSP)
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all text-sm font-semibold text-slate-700">
                      <div className="p-1.5 bg-amber-50 rounded-lg"><Archive className="h-4 w-4 text-amber-600" /></div>
                      Archivar borrador
                    </button>
                    {selectedScenario.status !== 'published' && (
                      <button className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all text-sm font-semibold text-emerald-800">
                        <div className="p-1.5 bg-emerald-500 rounded-lg"><CheckCircle2 className="h-4 w-4 text-white" /></div>
                        Publicar este escenario
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </button>
                    )}
                    <button className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all text-sm font-semibold text-red-700">
                      <div className="p-1.5 bg-red-100 rounded-lg"><Trash2 className="h-4 w-4 text-red-500" /></div>
                      Eliminar escenario
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* New Scenario Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <h2 className="font-bold text-slate-900">Crear Nuevo Escenario</h2>
              <button onClick={() => setModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Nombre del Escenario</label>
                <input type="text" placeholder="Ej. Semestre 2026-II Borrador" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Tipo</label>
                <select className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  <option value="draft">Borrador (editable)</option>
                  <option value="simulation">Simulación (solo lectura)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Descripción (opcional)</label>
                <textarea rows={3} placeholder="Describe el propósito de este escenario..." className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                <GitBranch className="h-4 w-4 shrink-0" />
                El nuevo escenario se creará como una bifurcación del escenario publicado actual.
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl">Cancelar</button>
              <button onClick={() => setModal(false)} className="px-5 py-2 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-700">Crear Escenario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
