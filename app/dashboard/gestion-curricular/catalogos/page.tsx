'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Pencil, Building, GraduationCap, Layers, BookOpen, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext';

export default function CatalogosPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('facultades');
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<any>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master-data');
      if (res.ok) {
        const data = await res.json();
        setMasterData(data);
      }
    } catch (err) {
      console.error("Error fetching master data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const tabs = [
    { id: 'facultades', label: 'Facultades', icon: Building, color: '#3b82f6', bg: '#eff6ff' },
    { id: 'carreras', label: 'Carreras', icon: GraduationCap, color: '#10b981', bg: '#f0fdf4' },
    { id: 'ciclos', label: 'Ciclos', icon: Layers, color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'planes', label: 'Planes de Estudio', icon: BookOpen, color: '#f59e0b', bg: '#fffbeb' },
    { id: 'sesiones', label: 'Tipos de Sesión', icon: Clock, color: '#ef4444', bg: '#fef2f2' },
  ];

  const handleOpenModal = (item?: Record<string, unknown>) => {
    setFormData(item ?? {});
    let id = '';
    if (item) {
      if (activeTab === 'facultades') id = String(item.id_facultad ?? '');
      else if (activeTab === 'carreras') id = String(item.id_carrera ?? '');
      else if (activeTab === 'ciclos') id = String(item.id_ciclo ?? '');
      else if (activeTab === 'planes') id = String(item.id_plan ?? '');
      else if (activeTab === 'sesiones') id = String(item.id_tipo_sesion ?? '');
    }
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let endpoint = '';
    let payload = { ...formData };

    if (activeTab === 'facultades') {
      endpoint = '/api/gestion-curricular/catalogos/facultad';
    } else if (activeTab === 'carreras') {
      endpoint = '/api/gestion-curricular/catalogos/carrera';
    } else if (activeTab === 'ciclos') {
      endpoint = '/api/gestion-curricular/catalogos/ciclo';
    } else if (activeTab === 'planes') {
      endpoint = '/api/gestion-curricular/catalogos/plan-estudio';
    } else if (activeTab === 'sesiones') {
      endpoint = '/api/gestion-curricular/catalogos/tipo-sesion';
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const payload = editingId ? { id: editingId, ...formData } : { ...formData };

      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchMasterData();
        handleCloseModal();
      } else {
        const err = await res.json();
        toast(err.error || 'Ocurrió un error al guardar', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Error de red al intentar guardar', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el registro ${id}?`)) return;

    let endpoint = '';
    if (activeTab === 'facultades') endpoint = '/api/gestion-curricular/catalogos/facultad';
    else if (activeTab === 'carreras') endpoint = '/api/gestion-curricular/catalogos/carrera';
    else if (activeTab === 'ciclos') endpoint = '/api/gestion-curricular/catalogos/ciclo';
    else if (activeTab === 'planes') endpoint = '/api/gestion-curricular/catalogos/plan-estudio';
    else if (activeTab === 'sesiones') endpoint = '/api/gestion-curricular/catalogos/tipo-sesion';

    try {
      const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMasterData();
      } else {
        const err = await res.json();
        toast(err.error || 'Ocurrió un error al eliminar', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderTable = () => {
    if (loading || !masterData) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando datos...</div>;

    let items: Record<string, unknown>[] = [];
    let columns: { key: string; label: string }[] = [];
    let idKey = '';

    if (activeTab === 'facultades') {
      items = masterData.facultades || [];
      columns = [{ key: 'nom_facultad', label: 'Nombre de la Facultad' }];
      idKey = 'id_facultad';
    } else if (activeTab === 'carreras') {
      items = (masterData.carreras || []).map((c: Record<string, unknown>) => ({
        ...c,
        nom_facultad: (masterData.facultades as Record<string, unknown>[])?.find((f: Record<string, unknown>) => f.id_facultad === c.id_facultad)?.nom_facultad || c.id_facultad
      }));
      columns = [
        { key: 'nom_carrera', label: 'Nombre de la Carrera' },
        { key: 'nom_facultad', label: 'Facultad' }
      ];
      idKey = 'id_carrera';
    } else if (activeTab === 'ciclos') {
      items = masterData.ciclos || [];
      columns = [{ key: 'nom_ciclo', label: 'Nombre del Ciclo' }];
      idKey = 'id_ciclo';
    } else if (activeTab === 'planes') {
      items = (masterData.planes || []).map((p: Record<string, unknown>) => ({
        ...p,
        nom_carrera: (masterData.carreras as Record<string, unknown>[])?.find((c: Record<string, unknown>) => c.id_carrera === p.id_carrera)?.nom_carrera || p.id_carrera
      }));
      columns = [
        { key: 'nom_plan', label: 'Nombre del Plan' },
        { key: 'nom_carrera', label: 'Carrera' }
      ];
      idKey = 'id_plan';
    } else if (activeTab === 'sesiones') {
      items = masterData.tipoSesiones || [];
      columns = [{ key: 'nom_tipo_sesion', label: 'Nombre del Tipo' }];
      idKey = 'id_tipo_sesion';
    }

    if (items.length === 0) {
      return (
        <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 20, border: '1px dashed var(--border-color)' }}>
          <Layers style={{ width: 48, height: 48, color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-secondary)' }}>No se encontraron registros</h3>
          <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 14 }}>Agrega un nuevo registro para comenzar.</p>
        </div>
      );
    }

    return (
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              {columns.map(col => (
                <th key={col.key} style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {col.label}
                </th>
              ))}
              <th style={{ padding: '16px 24px', width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: Record<string, unknown>, i: number) => {
              const id = String(item[idKey] ?? i);
              return (
                <tr key={id} style={{ borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--border-light)' }}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-primary)' }}>
                      {String(item[col.key] ?? '')}
                    </td>
                  ))}
                  <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenModal(item)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-secondary)', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
                      <Pencil style={{ width: 14, height: 14 }} />
                    </button>
                    <button onClick={() => handleDelete(id)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-secondary)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModalContent = () => {
    if (activeTab === 'facultades') {
      return (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre de la Facultad</label>
            <input required type="text" placeholder="Ej: Facultad de Ingeniería" value={formData.nom_facultad || ''} onChange={e => setFormData({ ...formData, nom_facultad: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }} />
          </div>
        </>
      );
    }

    if (activeTab === 'carreras') {
      return (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre de la Carrera</label>
            <input required type="text" placeholder="Ej: Ingeniería de Software" value={formData.nom_carrera || ''} onChange={e => setFormData({ ...formData, nom_carrera: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Facultad</label>
            <select required value={formData.id_facultad || ''} onChange={e => setFormData({ ...formData, id_facultad: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)' }}>
              <option value="">Selecciona una facultad...</option>
              {(masterData?.facultades as Record<string, unknown>[])?.map((f: Record<string, unknown>) => <option key={String(f.id_facultad)} value={String(f.id_facultad)}>{String(f.nom_facultad)}</option>)}
            </select>
          </div>
        </>
      );
    }

    if (activeTab === 'ciclos') {
      return (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre (Descripción)</label>
            <input required type="text" placeholder="Ej: Primer Ciclo" value={formData.nom_ciclo || ''} onChange={e => setFormData({ ...formData, nom_ciclo: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }} />
          </div>
        </>
      );
    }

    if (activeTab === 'planes') {
      return (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Plan</label>
            <input required type="text" placeholder="Ej: Malla Curricular 2026" value={formData.nom_plan || ''} onChange={e => setFormData({ ...formData, nom_plan: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Carrera</label>
            <select required value={formData.id_carrera || ''} onChange={e => setFormData({ ...formData, id_carrera: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)' }}>
              <option value="">Selecciona una carrera...</option>
              {(masterData?.carreras as Record<string, unknown>[])?.map((c: Record<string, unknown>) => <option key={String(c.id_carrera)} value={String(c.id_carrera)}>{String(c.nom_carrera)}</option>)}
            </select>
          </div>
        </>
      );
    }

    if (activeTab === 'sesiones') {
      return (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Tipo</label>
            <input required type="text" placeholder="Ej: Laboratorio" value={formData.nom_tipo_sesion || ''} onChange={e => setFormData({ ...formData, nom_tipo_sesion: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }} />
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button onClick={() => router.push('/dashboard/gestion-curricular')} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} />
        </button>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Catálogos Curriculares
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
            Administra Facultades, Carreras, Ciclos, Planes y Tipos de Sesión
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Sidebar Tabs */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14,
                  border: isActive ? `1.5px solid ${tab.color}` : '1.5px solid transparent',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: isActive ? 700 : 500, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 10, background: isActive ? tab.bg : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 16, height: 16, color: isActive ? tab.color : 'var(--text-tertiary)' }} />
                </div>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <button onClick={() => handleOpenModal()} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
              background: '#0f172a', border: 'none', color: 'white',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-md)',
              transition: 'transform 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Plus style={{ width: 16, height: 16 }} /> Nuevo Registro
            </button>
          </div>

          {renderTable()}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 440, borderRadius: 24, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {editingId ? 'Editar Registro: ' : 'Nuevo Registro: '} {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <form onSubmit={handleSubmit}>

              {renderModalContent()}

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button type="button" onClick={handleCloseModal} style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', background: '#0f172a', border: 'none', borderRadius: 12, color: 'white', fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
