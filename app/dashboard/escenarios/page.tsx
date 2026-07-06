'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers, Plus, Copy, Trash2, CheckCircle2, Clock, Archive,
  ArrowRight, X, GitBranch, Zap, Calendar, Users, Home
} from 'lucide-react';
import { getEscenarios, createEscenario, deleteEscenario, publishEscenario, duplicateEscenario, runOptimizationForEscenario } from './actions';

type ScenarioStatus = 'published' | 'draft' | 'simulation';
interface Scenario {
  id: string; name: string; status: ScenarioStatus; createdAt: string;
  createdBy: string; conflicts: number; coverage: number; description: string;
  ciclo: { id: number; name: string } | null;
  plan: { id: string; name: string } | null;
}

interface PlanOption {
  id_plan: string;
  nom_plan: string;
  id_carrera: string;
}

interface CicloOption {
  id_ciclo: number;
  nom_ciclo: string;
}

const STATUS_CFG = {
  published: { label: 'Publicado', color: '#059669', bg: '#f0fdf4', border: '#a7f3d0', dot: '#10b981', Icon: CheckCircle2 },
  draft: { label: 'Borrador', color: '#b45309', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', Icon: Clock },
  simulation: { label: 'Simulación', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6', Icon: GitBranch },
};

const card: React.CSSProperties = { background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

export default function EscenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  
  // Schedule Viewer state
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [scheduleViewBy, setScheduleViewBy] = useState<'teacher' | 'room'>('teacher');
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  
  // Create form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('draft');
  const [isProcessing, setIsProcessing] = useState(false);
  const [planes, setPlanes] = useState<PlanOption[]>([]);
  const [ciclos, setCiclos] = useState<CicloOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedCicloId, setSelectedCicloId] = useState<number | ''>('');
  const [ciclosLoading, setCiclosLoading] = useState(false);

  useEffect(() => {
    loadData();
    fetchPlanes();
  }, []);

  const fetchPlanes = async () => {
    try {
      const res = await fetch('/api/maestros');
      const data = await res.json();
      setPlanes(data.planesEstudio || []);
    } catch (e) {
      console.error('Error fetching planes:', e);
    }
  };

  const fetchCiclosByPlan = async (id_plan: string) => {
    if (!id_plan) {
      setCiclos([]);
      return;
    }
    setCiclosLoading(true);
    try {
      const res = await fetch(`/api/ciclos-por-plan?id_plan=${id_plan}`);
      const data = await res.json();
      setCiclos(data || []);
    } catch (e) {
      console.error('Error fetching ciclos:', e);
      setCiclos([]);
    } finally {
      setCiclosLoading(false);
    }
  };

  const loadData = async () => {
    const data = await getEscenarios();
    setScenarios(data);
    if (data.length > 0 && !selected) {
      setSelected(data[0].id);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !selectedPlanId || selectedCicloId === '') return;
    setIsProcessing(true);
    try {
      const nuevo = await createEscenario({
        name: newName,
        description: newDesc,
        type: newType,
        id_ciclo: selectedCicloId as number,
        id_plan: selectedPlanId,
      });
      await loadData();
      setSelected(nuevo.id_escenario);
      setModal(false);
      setNewName('');
      setNewDesc('');
      setSelectedPlanId('');
      setSelectedCicloId('');
      setCiclos([]);
    } catch (e) {
      console.error(e);
      alert('Error creando escenario');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!window.confirm('¿Estás seguro que deseas publicar este escenario como el horario oficial?')) return;
    setIsProcessing(true);
    await publishEscenario(id);
    await loadData();
    setIsProcessing(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este escenario? Esta acción no se puede deshacer.')) return;
    setIsProcessing(true);
    try {
      await deleteEscenario(id);
      setSelected(null);
      await loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsProcessing(true);
    try {
      const nuevo = await duplicateEscenario(id);
      await loadData();
      setSelected(nuevo.id_escenario);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimize = async (id: string) => {
    setIsProcessing(true);
    try {
      const result = await runOptimizationForEscenario(id);
      await loadData();
      const cov = (result as any)?.coverage;
      if (cov !== undefined && cov < 100) {
        alert(`Horario generado con cobertura parcial (${cov}%). Hay sesiones sin asignar. Revisa el horario y ajusta manualmente si es necesario.`);
      } else {
        alert('Horario generado y guardado en este escenario exitosamente.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewSchedule = async (id: string) => {
    setScheduleModal(true);
    setLoadingSchedule(true);
    try {
      const res = await fetch(`/api/escenarios/${id}/horario`);
      if (res.ok) {
        const data = await res.json();
        setScheduleData(data);
      } else {
        alert('Error al cargar horario');
      }
    } catch(e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const sel = scenarios.find(s => s.id === selected);
  const cfg = sel ? STATUS_CFG[sel.status] : null;
  const CfgIcon = cfg?.Icon ?? CheckCircle2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0 }}>Gestión de Escenarios</h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>Controla versiones de horarios, borradores, simulaciones y publicaciones.</p>
        </div>
        <button onClick={() => setModal(true)} disabled={isProcessing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: isProcessing ? 0.7 : 1 }}>
          <Plus style={{ width: 15, height: 15 }} /> Nuevo Escenario
        </button>
      </div>

      {/* Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left: Scenario List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scenarios.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>No hay escenarios. ¡Crea uno nuevo!</div>
          )}
          {scenarios.map(s => {
            const c = STATUS_CFG[s.status];
            const Icon = c.Icon;
            const isSelected = selected === s.id;
            return (
              <button key={s.id} onClick={() => setSelected(s.id)} style={{
                width: '100%', textAlign: 'left', background: 'white', border: `2px solid ${isSelected ? '#0f172a' : '#e2e8f0'}`,
                borderRadius: 14, padding: '16px 18px', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: isSelected ? '0 4px 16px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, paddingRight: 8 }}>{s.name}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>
                    <Icon style={{ width: 11, height: 11 }} />{c.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                  {s.createdAt} · por {s.createdBy}
                  {s.conflicts > 0 && <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 700 }}>· {s.conflicts} conflictos</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  <span>Cobertura</span><span style={{ color: s.coverage === 100 ? '#10b981' : s.coverage > 75 ? '#f59e0b' : '#ef4444' }}>{s.coverage}%</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.coverage}%`, borderRadius: 99, background: s.coverage === 100 ? '#10b981' : s.coverage > 75 ? '#f59e0b' : '#ef4444' }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Detail Panel */}
        {sel && cfg && (
          <div style={{ ...card, overflow: 'hidden' }}>
            {/* Detail Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{sel.name}</div>
                  <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 4 }}>{sel.description}</div>
                  {sel.plan && sel.ciclo && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#0369a1' }}>
                        {sel.plan.name}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#15803d' }}>
                        {sel.ciclo.name}
                      </span>
                    </div>
                  )}
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  <CfgIcon style={{ width: 14, height: 14 }} />{cfg.label}
                </span>
              </div>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'Cobertura', value: `${sel.coverage}%`, color: sel.coverage === 100 ? '#10b981' : '#f59e0b' },
                  { label: 'Conflictos', value: sel.conflicts, color: sel.conflicts === 0 ? '#10b981' : '#ef4444' },
                  { label: 'Última edición', value: sel.createdAt, color: '#0f172a' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 14, padding: '18px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
                    <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Acciones disponibles</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  
                  {sel.status === 'draft' && (
                    <button onClick={() => window.location.href = '/dashboard/horarios'} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#0f172a', fontFamily: 'inherit', textAlign: 'left', opacity: isProcessing ? 0.7 : 1, gridColumn: '1/-1' }}>
                      <div style={{ padding: 8, background: '#f1f5f9', borderRadius: 9 }}><Clock style={{ width: 15, height: 15, color: '#475569' }} /></div>
                      <div>
                        <div>Editar Manualmente (Gestor)</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 500 }}>Este es un borrador diseñado para modificaciones manuales.</div>
                      </div>
                      <ArrowRight style={{ width: 15, height: 15, marginLeft: 'auto', color: '#64748b' }} />
                    </button>
                  )}

                  <button onClick={() => handleOptimize(sel.id)} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, cursor: isProcessing ? 'not-allowed' : 'pointer', fontSize: 13.5, fontWeight: 600, color: '#8b5cf6', fontFamily: 'inherit', textAlign: 'left', opacity: isProcessing ? 0.7 : 1 }}>
                    <div style={{ padding: 8, background: '#f5f3ff', borderRadius: 9 }}><Zap style={{ width: 15, height: 15, color: '#8b5cf6' }} /></div>
                    <div>
                      <div>Re-optimizar (IA)</div>
                      {sel.status === 'simulation' && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 500 }}>Las simulaciones se actualizan por el motor CSP.</div>}
                    </div>
                  </button>

                  <button onClick={() => handleViewSchedule(sel.id)} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#f59e0b', fontFamily: 'inherit', textAlign: 'left', opacity: isProcessing ? 0.7 : 1 }}>
                    <div style={{ padding: 8, background: '#fffbeb', borderRadius: 9 }}><Calendar style={{ width: 15, height: 15, color: '#f59e0b' }} /></div>
                    <div>
                      <div>Visualizar Horario</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 500 }}>Ver el resultado generado.</div>
                    </div>
                  </button>

                  <button onClick={() => handleDuplicate(sel.id)} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#334155', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left', opacity: isProcessing ? 0.7 : 1 }}>
                    <div style={{ padding: 8, background: '#eff6ff', borderRadius: 9 }}><Copy style={{ width: 15, height: 15, color: '#3b82f6' }} /></div>
                    Duplicar escenario
                  </button>
                  
                  {sel.status !== 'published' && (
                    <button onClick={() => handlePublish(sel.id)} disabled={isProcessing || sel.coverage === 0} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: 12, cursor: (isProcessing || sel.coverage === 0) ? 'not-allowed' : 'pointer', fontSize: 13.5, fontWeight: 700, color: '#065f46', fontFamily: 'inherit', gridColumn: '1/-1', opacity: (isProcessing || sel.coverage === 0) ? 0.7 : 1 }}>
                      <div style={{ padding: 8, background: '#10b981', borderRadius: 9 }}><CheckCircle2 style={{ width: 15, height: 15, color: 'white' }} /></div>
                      Publicar este escenario como horario oficial
                      <ArrowRight style={{ width: 15, height: 15, marginLeft: 'auto' }} />
                    </button>
                  )}
                  
                  <button onClick={() => handleDelete(sel.id)} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#b91c1c', fontFamily: 'inherit', gridColumn: sel.status !== 'published' ? '1/-1' : 'auto', opacity: isProcessing ? 0.7 : 1 }}>
                    <div style={{ padding: 8, background: '#fee2e2', borderRadius: 9 }}><Trash2 style={{ width: 15, height: 15, color: '#ef4444' }} /></div>
                    {sel.status === 'published' ? 'Eliminar (Despublicar)' : 'Eliminar escenario'}
                  </button>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Scenario Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 480, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Crear Nuevo Escenario</h2>
              <button onClick={() => setModal(false)} style={{ padding: 6, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#64748b' }}><X style={{ width: 15, height: 15 }} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Plan de Estudio <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select value={selectedPlanId} onChange={e => {
                  const planId = e.target.value;
                  setSelectedPlanId(planId);
                  setSelectedCicloId('');
                  setCiclos([]);
                  if (planId) fetchCiclosByPlan(planId);
                }} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Seleccionar plan de estudio...</option>
                  {planes.map(p => (
                    <option key={p.id_plan} value={p.id_plan}>{p.nom_plan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Ciclo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select value={selectedCicloId} onChange={e => setSelectedCicloId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!selectedPlanId || ciclosLoading}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', opacity: !selectedPlanId ? 0.5 : 1 }}>
                  {!selectedPlanId ? (
                    <option value="">Primero selecciona un plan</option>
                  ) : ciclosLoading ? (
                    <option value="">Cargando ciclos...</option>
                  ) : ciclos.length === 0 ? (
                    <option value="">No hay ciclos disponibles para este plan</option>
                  ) : (
                    <>
                      <option value="">Seleccionar ciclo...</option>
                      {ciclos.map(c => (
                        <option key={c.id_ciclo} value={c.id_ciclo}>{c.nom_ciclo}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nombre del Escenario</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Semestre 2026-II Borrador" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tipo</label>
                <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="draft">Borrador (editable)</option>
                  <option value="simulation">Simulación (solo lectura)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Descripción</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Describe el propósito..." style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 13, color: '#1d4ed8' }}>
                <GitBranch style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                El nuevo escenario estará vacío hasta que corras la Re-optimización o dupliques uno existente.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <button onClick={() => setModal(false)} disabled={isProcessing} style={{ padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 13.5, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={handleCreate} disabled={isProcessing || !newName.trim() || !selectedPlanId || selectedCicloId === ''} style={{ padding: '9px 18px', background: '#0f172a', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit', opacity: (isProcessing || !newName.trim() || !selectedPlanId || selectedCicloId === '') ? 0.7 : 1 }}>{isProcessing ? 'Creando...' : 'Crear Escenario'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Viewer Modal */}
      {scheduleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#f8fafc', width: '100%', maxWidth: 1100, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Visualizador de Horario</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{sel?.name}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
                  <button onClick={() => setScheduleViewBy('teacher')} style={{ padding: '6px 14px', border: 'none', background: scheduleViewBy === 'teacher' ? 'white' : 'transparent', color: scheduleViewBy === 'teacher' ? '#0f172a' : '#64748b', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: scheduleViewBy === 'teacher' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    <Users style={{ width: 14, height: 14 }} /> Docentes
                  </button>
                  <button onClick={() => setScheduleViewBy('room')} style={{ padding: '6px 14px', border: 'none', background: scheduleViewBy === 'room' ? 'white' : 'transparent', color: scheduleViewBy === 'room' ? '#0f172a' : '#64748b', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: scheduleViewBy === 'room' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    <Home style={{ width: 14, height: 14 }} /> Aulas
                  </button>
                </div>
                <button onClick={() => setScheduleModal(false)} style={{ padding: 8, border: 'none', background: '#f1f5f9', borderRadius: 10, cursor: 'pointer', display: 'flex', color: '#64748b' }}><X style={{ width: 16, height: 16 }} /></button>
              </div>
            </div>
            
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {loadingSchedule ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontWeight: 600 }}>Cargando horario...</div>
              ) : scheduleData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontWeight: 600 }}>Este escenario no tiene sesiones asignadas aún.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                  {/* Agrupar los datos por Docente o por Aula */}
                  {Array.from(new Set(scheduleData.map(s => scheduleViewBy === 'teacher' ? s.teacherName : s.roomName))).sort().map(entityName => {
                    const sessions = scheduleData.filter(s => (scheduleViewBy === 'teacher' ? s.teacherName : s.roomName) === entityName);
                    
                    return (
                      <div key={entityName} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', background: '#0f172a', color: 'white', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {scheduleViewBy === 'teacher' ? <Users style={{ width: 16, height: 16, color: '#94a3b8' }}/> : <Home style={{ width: 16, height: 16, color: '#94a3b8' }}/>}
                          {entityName}
                          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20 }}>
                            {sessions.length} sesiones
                          </span>
                        </div>
                        <div style={{ padding: 20 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: 10 }}>
                            {/* Header row */}
                            <div></div>
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(d => (
                              <div key={d} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#475569', paddingBottom: 10 }}>{d}</div>
                            ))}
                            
                            {/* Time Slots */}
                            {[0, 1, 2, 3, 4].map(slot => (
                              <React.Fragment key={slot}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  Bloque {slot + 1}
                                </div>
                                {[0, 1, 2, 3, 4].map(day => {
                                  const s = sessions.find(x => x.day === day && x.slot === slot);
                                  return (
                                    <div key={`${day}-${slot}`} style={{ background: s ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${s ? '#a7f3d0' : '#f1f5f9'}`, borderRadius: 12, padding: 12, minHeight: 70, display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.2s' }}>
                                      {s && (
                                        <>
                                          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#065f46', lineHeight: 1.2 }}>{s.courseName}</div>
                                          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                                            {scheduleViewBy === 'teacher' ? <Home style={{ width: 11, height: 11 }} /> : <Users style={{ width: 11, height: 11 }} />}
                                            {scheduleViewBy === 'teacher' ? s.roomName : s.teacherName}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
