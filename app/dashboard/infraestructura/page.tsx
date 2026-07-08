'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, ChevronDown } from 'lucide-react';

const ROOM_TYPES = [
  { value: 'classroom', label: 'Aula Teórica', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'computer-lab', label: 'Lab. Cómputo', color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'workshop', label: 'Taller', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'practical-lab', label: 'Lab. Práctico', color: '#10b981', bg: '#f0fdf4' },
];

const card: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'var(--bg-card)' };

export default function InfraestructuraPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('classroom');
  const [formCapacity, setFormCapacity] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/aulas')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRooms(data.map((a: any) => ({
            id: a.id_aula,
            name: a.nom_aula,
            type: a.id_tipo_aula,
            capacity: a.capacidad,
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const reloadRooms = async () => {
    const res = await fetch('/api/aulas');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      setRooms(data.map((a: any) => ({
        id: a.id_aula,
        name: a.nom_aula,
        type: a.id_tipo_aula,
        capacity: a.capacidad,
      })));
    }
  };

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterType || r.type === filterType)
  );

  const totalCapacity = rooms.reduce((a: number, r: any) => a + r.capacity, 0);
  const getCfg = (type: string) => ROOM_TYPES.find(r => r.value === type) ?? ROOM_TYPES[0];

  const openCreate = () => {
    setEditId(null);
    setFormName('');
    setFormType('classroom');
    setFormCapacity(30);
    setErrorMsg('');
    setModal(true);
  };

  const openEdit = (room: any) => {
    setEditId(room.id);
    setFormName(room.name);
    setFormType(room.type);
    setFormCapacity(room.capacity);
    setErrorMsg('');
    setModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setErrorMsg('El nombre del aula es requerido');
      return;
    }
    setErrorMsg('');
    setSaving(true);
    try {
      if (editId) {
        const res = await fetch(`/api/aulas/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName.trim(), type: formType, capacity: formCapacity }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al actualizar');
        }
      } else {
        const res = await fetch('/api/aulas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: crypto.randomUUID(), name: formName.trim(), type: formType, capacity: formCapacity }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al crear');
        }
      }
      setModal(false);
      await reloadRooms();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este espacio?')) return;
    try {
      const res = await fetch(`/api/aulas/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      await reloadRooms();
    } catch (e: any) {
      alert(e.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Cargando espacios...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>Infraestructura Física</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Administra aulas, laboratorios y talleres disponibles para la programación.</p>
        </div>
        <button onClick={openCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus style={{ width: 15, height: 15 }} />Nuevo Espacio
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Espacios Totales', value: rooms.length, color: '#0f172a' },
          { label: 'Capacidad Total (pax)', value: totalCapacity, color: '#3b82f6' },
          { label: 'Aulas Teóricas', value: rooms.filter(r => r.type === 'classroom').length, color: '#8b5cf6' },
          { label: 'Laboratorios', value: rooms.filter(r => r.type !== 'classroom' && r.type !== 'workshop').length, color: '#10b981' },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Buscar espacio..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <div style={{ position: 'relative', minWidth: 180 }}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ ...inputStyle, paddingRight: 32, appearance: 'none', cursor: 'pointer', width: 'auto' }}>
            <option value="">Todos los tipos</option>
            {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', ...card, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 300, color: 'var(--text-tertiary)', marginBottom: 8 }}>{'{}'}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-tertiary)' }}>No se encontraron espacios</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Crea un nuevo espacio con el botón "Nuevo Espacio".</div>
          </div>
        )}
        {filtered.map(room => {
          const cfg = getCfg(room.type);
          const pct = room.capacity > 0 ? Math.min(95, 40 + Math.floor(room.capacity / 2)) : 50;
          return (
            <div key={room.id} style={{ ...card, padding: '22px 24px', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{room.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(room)}
                    style={{ padding: 7, border: 'none', background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}>
                    <Edit2 style={{ width: 13, height: 13 }} />
                  </button>
                  <button onClick={() => handleDelete(room.id)}
                    style={{ padding: 7, border: 'none', background: '#fef2f2', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#ef4444' }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: cfg.bg, color: cfg.color, marginBottom: 16 }}>{cfg.label}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span>Capacidad: <strong style={{ color: 'var(--text-primary)' }}>{room.capacity} pax</strong></span>
                <span style={{ fontWeight: 600, color: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981' }}>Uso: {pct}%</span>
              </div>
              <div style={{ height: 7, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 500, borderRadius: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{editId ? 'Editar Espacio' : 'Nuevo Espacio Físico'}</h2>
              <button onClick={() => setModal(false)} style={{ padding: 6, border: 'none', background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {errorMsg && <div style={{ color: '#dc2626', fontSize: 13, padding: '10px 14px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>{errorMsg}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Nombre / Código</label>
                  <input type="text" placeholder="Ej. A-301" value={formName} onChange={e => setFormName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Tipo</label>
                  <select value={formType} onChange={e => setFormType(e.target.value)} style={inputStyle}>
                    {ROOM_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Capacidad (pax)</label>
                  <input type="number" min={1} value={formCapacity} onChange={e => setFormCapacity(Number(e.target.value))} style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
              <button onClick={() => setModal(false)} style={{ padding: '9px 18px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-card)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 18px', background: '#0f172a', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
