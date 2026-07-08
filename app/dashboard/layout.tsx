'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart3, BookOpen, Users, Building2, CalendarDays,
  Settings, LogOut, Search, Bell, Layers, Activity, GraduationCap,
  AlertTriangle, Info, Megaphone,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NotifItem {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  link: string | null;
  creadoEl: string;
}

interface NotifPrefs {
  conflictos: boolean;
  publicacion: boolean;
  semanal: boolean;
  email: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const { effectiveTheme } = useTheme();
  const { t, lang } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const filteredNotifs = useMemo(() => {
    if (!notifPrefs) return notifs;
    return notifs.filter(n => {
      if (n.tipo === 'conflicto' && !notifPrefs.conflictos) return false;
      if (n.tipo === 'publicacion' && !notifPrefs.publicacion) return false;
      return true;
    });
  }, [notifs, notifPrefs]);

  const unreadCount = filteredNotifs.filter(n => !n.leida).length;

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

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/notificaciones?userId=${user.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotifs(data); })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/auth/preferences?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.preferencias?.notificaciones) {
          setNotifPrefs(data.preferencias.notificaciones as NotifPrefs);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notificaciones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leida: true }) });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const notifIcon = (tipo: string) => {
    switch (tipo) {
      case 'conflicto': return <AlertTriangle style={{ width: 14, height: 14, color: '#ef4444' }} />;
      case 'publicacion': return <Megaphone style={{ width: 14, height: 14, color: '#10b981' }} />;
      default: return <Info style={{ width: 14, height: 14, color: '#3b82f6' }} />;
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  if (loading || !user) return null;

  const navItems = [
    { name: t('nav.inicio'), path: '/dashboard', icon: BarChart3 },
    { name: t('nav.gestionCurricular'), path: '/dashboard/gestion-curricular', icon: BookOpen },
    { name: t('nav.recursos'), path: '/dashboard/recursos', icon: Users },
    { name: t('nav.infraestructura'), path: '/dashboard/infraestructura', icon: Building2 },
    { name: t('nav.escenarios'), path: '/dashboard/escenarios', icon: Layers },
    { name: t('nav.gestorHorarios'), path: '/dashboard/horarios', icon: CalendarDays },
    { name: t('nav.reportes'), path: '/dashboard/reportes', icon: Activity },
    { name: t('nav.configuracion'), path: '/dashboard/configuracion', icon: Settings },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 260, background: 'var(--bg-sidebar)', flexShrink: 0, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', zIndex: 20 }}>
        {/* Logo */}
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
            <GraduationCap style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'white', letterSpacing: '-0.3px' }}>{t('common.appName')}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('common.appSuite')}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-sidebar-heading)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px 8px' }}>{t('nav.modules')}</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
                fontSize: 13.5, fontWeight: active ? 600 : 500,
                background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
                color: active ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
                transition: 'all 0.15s ease',
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
              }}>
                <Icon style={{ width: 17, height: 17, flexShrink: 0, color: active ? 'var(--accent)' : 'rgba(255,255,255,0.35)' }} />
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
            <button onClick={logout} title={t('nav.logout')} style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', transition: 'color 0.15s' }}
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
        <header style={{ height: 64, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder={t('topbar.searchPlaceholder')} style={{
              width: '100%', padding: '8px 44px 8px 36px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', borderRadius: 10,
              fontSize: 13.5, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
            }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'var(--bg-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.background = 'var(--bg-secondary)'; e.target.style.boxShadow = 'none'; }}
            />
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
              <kbd style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 5, padding: '1px 5px', fontFamily: 'monospace' }}>⌘K</kbd>
            </div>
          </div>
          <div ref={notifRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{ position: 'relative', padding: 8, borderRadius: 10, background: notifOpen ? 'var(--bg-hover)' : 'transparent', border: 'none', cursor: 'pointer', color: notifOpen ? 'var(--text-primary)' : 'var(--text-tertiary)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { if (!notifOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; } }}>
              <Bell style={{ width: 18, height: 18 }} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 5, right: 5, minWidth: 16, height: 16, borderRadius: 99, background: '#ef4444', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 9, fontWeight: 800, lineHeight: 1, padding: '0 4px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 360, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t('topbar.notifications')}</span>
                  {unreadCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{unreadCount} {t('topbar.unread')}</span>}
                </div>
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {filteredNotifs.length === 0 ? (
                    <div style={{ padding: '36px 18px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>{t('topbar.noNotifications')}</div>
                  ) : (
                    filteredNotifs.map(n => (
                      <button key={n.id} onClick={() => { if (!n.leida) markRead(n.id); }} style={{
                        display: 'flex', gap: 12, padding: '12px 18px', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%', transition: 'background 0.1s',
                        background: n.leida ? 'var(--bg-primary)' : 'var(--bg-success)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = n.leida ? 'var(--bg-primary)' : 'var(--bg-success)'; }}>
                        <div style={{ marginTop: 2, flexShrink: 0 }}>{notifIcon(n.tipo)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.mensaje}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{timeAgo(n.creadoEl)}</div>
                        </div>
                        {!n.leida && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg-secondary)' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
