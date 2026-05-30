'use client';

import { useState } from 'react';
import { Building2, Plus, Search, Edit2, Trash2, X, ChevronDown } from 'lucide-react';

const ROOM_TYPES = [
  { value: 'classroom', label: 'Aula Teórica', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'computer-lab', label: 'Lab. Cómputo', color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'workshop', label: 'Taller', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'practical-lab', label: 'Lab. Práctico', color: '#10b981', bg: '#f0fdf4' },
];
const BUILDINGS = ['Edificio A', 'Edificio B', 'Edificio C', 'Campus Norte'];

interface Room { id: string; name: string; building: string; type: string; capacity: number; floor: number; features: string[] }

const MOCK_ROOMS: Room[] = [
  { id: '1', name: 'A-101', building: 'Edificio A', type: 'classroom', capacity: 40, floor: 1, features: ['Proyector', 'AC'] },
  { id: '2', name: 'A-201', building: 'Edificio A', type: 'classroom', capacity: 45, floor: 2, features: ['Proyector', 'AC', 'Pizarrón digital'] },
  { id: '3', name: 'Lab-B1', building: 'Edificio B', type: 'computer-lab', capacity: 30, floor: 1, features: ['30 PCs', 'Proyector', 'AC'] },
  { id: '4', name: 'Lab-B2', building: 'Edificio B', type: 'computer-lab', capacity: 25, floor: 1, features: ['25 PCs', 'AC'] },
  { id: '5', name: 'Taller-C1', building: 'Edificio C', type: 'workshop', capacity: 20, floor: 1, features: ['Equipo eléctrico', 'Bancas'] },
  { id: '6', name: 'Lab-Prac-C2', building: 'Edificio C', type: 'practical-lab', capacity: 22, floor: 2, features: ['Microscopios', 'Campana'] },
];

const card: React.CSSProperties = { background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white' };

export default function InfraestructuraPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = MOCK_ROOMS.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterType || r.type === filterType) &&
    (!filterBuilding || r.building === filterBuilding)
  );

  const totalCapacity = MOCK_ROOMS.reduce((a, r) => a + r.capacity, 0);
  const getCfg = (type: string) => ROOM_TYPES.find(r => r.value === type) ?? ROOM_TYPES[0];
  const usedPct = (id: string) => ((id.charCodeAt(0) * 37) % 40) + 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...card, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0 }}>Infraestructura Física</h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>Administra aulas, laboratorios y talleres disponibles para la programación.</p>
        </div>
        <button onClick={() => { setEditId(null); setModal(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', padding: '9px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus style={{ width: 15, height: 15 }} />Nuevo Espacio
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Espacios Totales', value: MOCK_ROOMS.length, color: '#0f172a' },
          { label: 'Capacidad Total (pax)', value: totalCapacity, color: '#3b82f6' },
          { label: 'Aulas Teóricas', value: MOCK_ROOMS.filter(r => r.type === 'classroom').length, color: '#8b5cf6' },
          { label: 'Laboratorios', value: MOCK_ROOMS.filter(r => r.type !== 'classroom' && r.type !== 'workshop').length, color: '#10b981' },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
          <input type="text" placeholder="Buscar espacio..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        {[
          { value: filterType, onChange: setFilterType, options: ROOM_TYPES.map(t => ({ value: t.value, label: t.label })), placeholder: 'Todos los tipos' },
          { value: filterBuilding, onChange: setFilterBuilding, options: BUILDINGS.map(b => ({ value: b, label: b })), placeholder: 'Todos los edificios' },
        ].map((sel, i) => (
          <div key={i} style={{ position: 'relative', minWidth: 180 }}>
            <select value={sel.value} onChange={e => sel.onChange(e.target.value)}
              style={{ ...inputStyle, paddingRight: 32, appearance: 'none', cursor: 'pointer', width: 'auto' }}>
              <option value="">{sel.placeholder}</option>
              {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
        {filtered.map(room => {
          const cfg = getCfg(room.type);
          const pct = usedPct(room.id);
          return (
            <div key={room.id} style={{ ...card, padding: '22px 24px', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{room.name}</div>
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>{room.building} — Piso {room.floor}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditId(room.id); setModal(true); }}
                    style={{ padding: 7, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#475569' }}>
                    <Edit2 style={{ width: 13, height: 13 }} />
                  </button>
                  <button style={{ padding: 7, border: 'none', background: '#fef2f2', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#ef4444' }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: cfg.bg, color: cfg.color, marginBottom: 16 }}>{cfg.label}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}>
                <span>Capacidad: <strong style={{ color: '#0f172a' }}>{room.capacity} pax</strong></span>
                <span style={{ fontWeight: 600, color: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981' }}>Uso: {pct}%</span>
              </div>
              <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {room.features.map(f => (
                  <span key={f} style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>{f}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{editId ? 'Editar Espacio' : 'Nuevo Espacio Físico'}</h2>
              <button onClick={() => setModal(false)} style={{ padding: 6, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer', display: 'flex', color: '#64748b' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nombre / Código</label>
                  <input type="text" placeholder="Ej. A-301" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Edificio</label>
                  <select style={inputStyle}>
                    {BUILDINGS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tipo</label>
                  <select style={inputStyle}>
                    {ROOM_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Capacidad (pax)</label>
                  <input type="number" defaultValue={30} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Piso</label>
                  <input type="number" defaultValue={1} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Equipamiento</label>
                  <input type="text" placeholder="Proyector, AC..." style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <button onClick={() => setModal(false)} style={{ padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 13.5, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={() => setModal(false)} style={{ padding: '9px 18px', background: '#0f172a', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
