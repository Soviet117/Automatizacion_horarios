'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  User, Lock, Bell, Palette, Shield, Globe, Eye, EyeOff,
  Save, Check, ChevronRight, Sun, Moon, Monitor, Mail, Phone, Building2, AlertTriangle, Camera, X
} from 'lucide-react';

type Section = 'perfil' | 'seguridad' | 'notificaciones' | 'apariencia' | 'sistema';

const SECTIONS: { id: Section; labelKey: string; descKey: string; Icon: React.ElementType }[] = [
  { id: 'perfil', labelKey: 'settings.profile.title', descKey: 'settings.profile.desc', Icon: User },
  { id: 'seguridad', labelKey: 'settings.security.title', descKey: 'settings.security.desc', Icon: Lock },
  { id: 'notificaciones', labelKey: 'settings.notifications.title', descKey: 'settings.notifications.desc', Icon: Bell },
  { id: 'apariencia', labelKey: 'settings.appearance.title', descKey: 'settings.appearance.desc', Icon: Palette },
  { id: 'sistema', labelKey: 'settings.system.title', descKey: 'settings.system.desc', Icon: Shield },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 11,
  fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'var(--bg-primary)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7,
};

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      style={{ width: 44, height: 24, borderRadius: 99, background: on ? 'var(--accent)' : 'var(--border-color)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  );
}

export default function ConfiguracionPage() {
  const { user, updateUser } = useAuth();
  const { setTheme: setThemeGlobal } = useTheme();
  const { setLang, t } = useLanguage();
  const [section, setSection] = useState<Section>('perfil');
  const [showPw, setShowPw] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Perfil
  const [profile, setProfile] = useState({ nombre: '', email: '', telefono: '', departamento: '', avatar_url: '' });

  // Seguridad
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');

  // Notificaciones
  const [notifs, setNotifs] = useState({ conflictos: true, publicacion: true, semanal: false, email: true });

  // Apariencia
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [idioma, setIdioma] = useState('es');

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const userId = user?.id;

  // Load profile on mount
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/auth/profile?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        const av = data.avatar_url || '';
        setProfile({
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono || '',
          departamento: data.departamento || '',
          avatar_url: av,
        });
        if (av) setAvatarPreview(av);
        if (data.nombre) updateUser({ name: data.nombre, email: data.email });
        if (data.preferencias) {
          const p = data.preferencias;
          if (p.notificaciones) setNotifs(prev => ({ ...prev, ...p.notificaciones }));
          if (p.apariencia) {
            if (p.apariencia.theme) {
              setTheme(p.apariencia.theme);
              setThemeGlobal(p.apariencia.theme);
            }
            if (p.apariencia.idioma) {
              setIdioma(p.apariencia.idioma);
              setLang(p.apariencia.idioma as 'es' | 'en');
            }
          }
        }
      })
      .catch(() => {});
  }, [userId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(t('errors.imageTooBig'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAvatarPreview(b64);
      setProfile(prev => ({ ...prev, avatar_url: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setProfile(p => ({ ...p, avatar_url: '' }));
  };

  const showToast = () => {
    setError('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2800);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...profile }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || t('errors.connectionError'));
      } else {
        const data = await res.json();
        updateUser({ name: data.nombre, email: data.email });
        showToast();
      }
    } catch {
      setError(t('errors.connectionError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!userId) return;
    if (pwNew !== pwConfirm) { setError(t('errors.passwordMismatch')); return; }
    if (pwNew.length < 6) { setError(t('errors.passwordTooShort')); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword: pwCurrent, newPassword: pwNew }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || t('errors.connectionError'));
      } else {
        setPwCurrent(''); setPwNew(''); setPwConfirm('');
        showToast();
      }
    } catch {
      setError(t('errors.connectionError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferencias: { notificaciones: notifs, apariencia: { theme, idioma } } }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || t('errors.connectionError'));
      } else {
        setThemeGlobal(theme);
        setLang(idioma as 'es' | 'en');
        showToast();
      }
    } catch {
      setError(t('errors.connectionError'));
    } finally {
      setSaving(false);
    }
  };

  const card: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...card, padding: '20px 28px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>{t('settings.title')}</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('settings.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Sidebar Nav */}
        <div style={{ ...card, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECTIONS.map(s => {
            const Icon = s.Icon;
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                background: active ? 'var(--bg-active)' : 'transparent',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                <Icon style={{ width: 16, height: 16, flexShrink: 0, color: active ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'white' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(s.labelKey)}</div>
                  <div style={{ fontSize: 11.5, color: active ? 'rgba(255,255,255,0.45)' : 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(s.descKey)}</div>
                </div>
                <ChevronRight style={{ width: 13, height: 13, color: active ? 'var(--accent)' : 'var(--border-color)', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div style={card}>

          {/* ── PERFIL ── */}
          {section === 'perfil' && (
            <>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{t('settings.profile.header')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{t('settings.profile.headerDesc')}</div>
              </div>
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                  <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #475569, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22 }}>
                        {(profile.nombre || user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: '#0f172a', border: '2px solid var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', padding: 0 }}>
                      <Camera style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{profile.nombre || user?.name || 'Usuario'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize', marginTop: 2 }}>{user?.role ?? 'user'}</div>
                    {avatarPreview && (
                      <button type="button" onClick={handleRemoveAvatar} style={{ fontSize: 12, color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <X style={{ width: 12, height: 12 }} /> {t('settings.profile.removePhoto')}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}><User style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />{t('settings.profile.nombre')}</label>
                    <input type="text" value={profile.nombre} onChange={e => setProfile(p => ({ ...p, nombre: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label style={labelStyle}><Mail style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />{t('settings.profile.email')}</label>
                    <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label style={labelStyle}><Phone style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />{t('settings.profile.telefono')}</label>
                    <input type="tel" value={profile.telefono} onChange={e => setProfile(p => ({ ...p, telefono: e.target.value }))} placeholder={t('settings.profile.telefonoPlaceholder')} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label style={labelStyle}><Building2 style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />{t('settings.profile.departamento')}</label>
                    <input type="text" value={profile.departamento} onChange={e => setProfile(p => ({ ...p, departamento: e.target.value }))} placeholder={t('settings.profile.departamentoPlaceholder')} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 28px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <button onClick={handleSaveProfile} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'white', padding: '10px 22px', borderRadius: 11, fontSize: 14, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                  <Save style={{ width: 15, height: 15 }} />{saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </>
          )}

          {/* ── SEGURIDAD ── */}
          {section === 'seguridad' && (
            <>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{t('settings.security.header')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{t('settings.security.headerDesc')}</div>
              </div>
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}><Lock style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />{t('settings.security.currentPassword')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                      {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t('settings.security.newPassword')}</label>
                  <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder={t('settings.security.newPasswordPlaceholder')} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={labelStyle}>{t('settings.security.confirmPassword')}</label>
                  <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder={t('settings.security.confirmPlaceholder')} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'var(--bg-info)', border: '1px solid var(--border-info)', borderRadius: 12, fontSize: 13, color: 'var(--text-info)' }}>
                  <Shield style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  <span>{t('settings.security.tip')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 28px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <button onClick={handleSavePassword} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'white', padding: '10px 22px', borderRadius: 11, fontSize: 14, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                  <Lock style={{ width: 15, height: 15 }} />{saving ? t('common.updating') : t('common.update')}
                </button>
              </div>
            </>
          )}

          {/* ── NOTIFICACIONES ── */}
          {section === 'notificaciones' && (
            <>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{t('settings.notifications.header')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{t('settings.notifications.headerDesc')}</div>
              </div>
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {([
                  { key: 'conflictos' as const, labelKey: 'settings.notifications.conflictos', descKey: 'settings.notifications.conflictosDesc' },
                  { key: 'publicacion' as const, labelKey: 'settings.notifications.publicacion', descKey: 'settings.notifications.publicacionDesc' },
                  { key: 'semanal' as const, labelKey: 'settings.notifications.semanal', descKey: 'settings.notifications.semanalDesc' },
                  { key: 'email' as const, labelKey: 'settings.notifications.email', descKey: 'settings.notifications.emailDesc' },
                ]).map(n => (
                  <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 18px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{t(n.labelKey)}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{t(n.descKey)}</div>
                    </div>
                    <Toggle on={notifs[n.key]} onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 28px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <button onClick={handleSavePreferences} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'white', padding: '10px 22px', borderRadius: 11, fontSize: 14, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                  <Save style={{ width: 15, height: 15 }} />{saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </>
          )}

          {/* ── APARIENCIA ── */}
          {section === 'apariencia' && (
            <>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{t('settings.appearance.header')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{t('settings.appearance.headerDesc')}</div>
              </div>
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{t('settings.appearance.themeLabel')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {([
                      { id: 'light' as const, labelKey: 'settings.appearance.light', Icon: Sun },
                      { id: 'dark' as const, labelKey: 'settings.appearance.dark', Icon: Moon },
                      { id: 'system' as const, labelKey: 'settings.appearance.system', Icon: Monitor },
                    ]).map(opt => {
                      const Icon = opt.Icon;
                      const active = theme === opt.id;
                      return (
                        <button key={opt.id} type="button" onClick={() => setTheme(opt.id)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px',                   border: `2px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`, borderRadius: 14, background: active ? 'var(--bg-secondary)' : 'var(--bg-primary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                          <Icon style={{ width: 24, height: 24, color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }} />
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{t(opt.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 8 }}><Globe style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />{t('settings.appearance.languageLabel')}</label>
                  <select value={idioma} onChange={e => setIdioma(e.target.value)} style={{ ...inputStyle, width: 240 }}>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 28px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <button onClick={handleSavePreferences} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'white', padding: '10px 22px', borderRadius: 11, fontSize: 14, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                  <Save style={{ width: 15, height: 15 }} />{saving ? t('common.saving') : t('common.apply')}
                </button>
              </div>
            </>
          )}

          {/* ── SISTEMA CSP ── */}
          {section === 'sistema' && (
            <>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{t('settings.system.header')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{t('settings.system.headerDesc')}</div>
              </div>
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'var(--bg-warning)', border: '1px solid var(--border-warning)', borderRadius: 12, fontSize: 13, color: 'var(--text-warning)' }}>
                  <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  <span>{t('settings.system.warning')}</span>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {error && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 10, background: '#dc2626', color: 'white',
          padding: '12px 22px', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 200,
          fontSize: 14, fontWeight: 600,
        }}>
          <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: error ? 80 : 28, left: '50%', transform: `translateX(-50%) translateY(${saved ? 0 : 12}px)`,
        display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent)', color: 'white',
        padding: '12px 22px', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 200,
        opacity: saved ? 1 : 0, transition: 'all 0.3s', pointerEvents: saved ? 'auto' : 'none', fontSize: 14, fontWeight: 600,
      }}>
        <Check style={{ width: 15, height: 15, color: 'var(--accent)' }} />
        {t('common.savedSuccess')}
      </div>
    </div>
  );
}
