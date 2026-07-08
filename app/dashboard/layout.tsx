'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, BookOpen, Users, Building2, CalendarDays,
  Settings, LogOut, Search, Bell, Layers, Activity, GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/auth/profile?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      })
      .catch(() => {});
  }, [user?.id]);

  if (loading || !user) return null;

  const navItems = [
    { name: 'Inicio', path: '/dashboard', icon: BarChart3 },
    { name: 'Gestión Curricular', path: '/dashboard/gestion-curricular', icon: BookOpen },
    { name: 'Recursos', path: '/dashboard/recursos', icon: Users },
    { name: 'Infraestructura', path: '/dashboard/infraestructura', icon: Building2 },
    { name: 'Escenarios', path: '/dashboard/escenarios', icon: Layers },
    { name: 'Gestor de Horarios', path: '/dashboard/horarios', icon: CalendarDays },
    { name: 'Reportes', path: '/dashboard/reportes', icon: Activity },
    { name: 'Configuración', path: '/dashboard/configuracion', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 260, background: '#0f172a', flexShrink: 0, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', zIndex: 20 }}>
        {/* Logo */}
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
            <GraduationCap style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'white', letterSpacing: '-0.3px' }}>Optimizer EIS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Academic Suite</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px 8px' }}>Módulos</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
                fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                background: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
                color: isActive ? '#10b981' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
              }}>
                <Icon style={{ width: 17, height: 17, flexShrink: 0, color: isActive ? '#10b981' : 'rgba(255,255,255,0.35)' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #475569, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: 'white', flexShrink: 0 }}>
                {user.name.charAt(0)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
              <LogOut style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: 64, background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
            <input type="text" placeholder="Buscar materias, docentes o cohortes..." style={{
              width: '100%', padding: '8px 44px 8px 36px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: 13.5, color: '#475569', outline: 'none', fontFamily: 'inherit',
            }}
              onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
            />
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
              <kbd style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', background: 'white', border: '1px solid #e2e8f0', borderRadius: 5, padding: '1px 5px', fontFamily: 'monospace' }}>⌘K</kbd>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button style={{ position: 'relative', padding: 8, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
              <Bell style={{ width: 18, height: 18 }} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid white' }} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f8fafc' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
