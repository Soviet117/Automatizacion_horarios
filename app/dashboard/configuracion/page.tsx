'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User, Lock, Bell, Palette, Shield, Globe, Eye, EyeOff,
  Save, Check, ChevronRight, Sun, Moon, Monitor, 
  Mail, Phone, Building2, AlertTriangle
} from 'lucide-react';
import { cn } from '../../../lib/utils';

type SettingsSection = 'perfil' | 'seguridad' | 'notificaciones' | 'apariencia' | 'sistema';

const SECTIONS: { id: SettingsSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'perfil', label: 'Perfil de Usuario', icon: User, description: 'Nombre, correo e información personal' },
  { id: 'seguridad', label: 'Seguridad', icon: Lock, description: 'Contraseña y verificación' },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell, description: 'Alertas y preferencias de aviso' },
  { id: 'apariencia', label: 'Apariencia', icon: Palette, description: 'Tema, idioma y visualización' },
  { id: 'sistema', label: 'Sistema', icon: Shield, description: 'Configuración avanzada del motor CSP' },
];

function SaveBanner({ show }: { show: boolean }) {
  return (
    <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl transition-all duration-300",
      show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
    )}>
      <Check className="h-4 w-4 text-emerald-400" />
      <span className="text-sm font-semibold">Cambios guardados correctamente.</span>
    </div>
  );
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [section, setSection] = useState<SettingsSection>('perfil');
  const [showPw, setShowPw] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Notification toggles state
  const [notifs, setNotifs] = useState({
    conflictos: true,
    publicacion: true,
    semanal: false,
    email: true,
  });

  // CSP settings
  const [cspSettings, setCspSettings] = useState({
    maxTime: 60,
    hardConflict: true,
    softConflict: true,
    balanceLoad: true,
    preferMorning: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">

      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">Administra tu cuenta, seguridad y preferencias del sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar Nav */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm h-fit">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-0.5",
                  isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                )}>
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-400" : "text-slate-400")} />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-semibold truncate", isActive ? "text-white" : "text-slate-800")}>{s.label}</div>
                  <div className={cn("text-xs truncate", isActive ? "text-slate-300" : "text-slate-400")}>{s.description}</div>
                </div>
                <ChevronRight className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-400" : "text-slate-300")} />
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* ─── PERFIL ─── */}
          {section === 'perfil' && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-900">Perfil de Usuario</h2>
                <p className="text-sm text-slate-500">Tu información personal y de contacto.</p>
              </div>
              <div className="p-6 flex flex-col gap-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-3xl shrink-0">
                    {user?.name?.charAt(0) ?? 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{user?.name ?? 'Usuario'}</p>
                    <p className="text-sm text-slate-500 capitalize">{user?.role ?? 'user'}</p>
                  </div>
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Cambiar foto</button>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> Nombre Completo</label>
                    <input type="text" defaultValue={user?.name} className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> Nombre de Usuario</label>
                    <input type="text" defaultValue={user?.username} className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> Correo Electrónico</label>
                    <input type="email" defaultValue={`${user?.username}@uni.edu`} className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> Teléfono (opcional)</label>
                    <input type="tel" placeholder="+52 555 000 0000" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> Departamento / Área</label>
                    <input type="text" placeholder="Ej. Coordinación Académica" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors">
                  <Save className="h-4 w-4" /> Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {/* ─── SEGURIDAD ─── */}
          {section === 'seguridad' && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-900">Seguridad y Contraseña</h2>
                <p className="text-sm text-slate-500">Actualiza tus credenciales de acceso.</p>
              </div>
              <div className="p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Contraseña Actual</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} placeholder="••••••••" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white pr-10" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nueva Contraseña</label>
                  <input type="password" placeholder="Mín. 8 caracteres" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Confirmar Nueva Contraseña</label>
                  <input type="password" placeholder="Repite la contraseña" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 flex gap-2">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Se recomienda usar al menos 12 caracteres con mayúsculas, números y símbolos para una contraseña segura.</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors">
                  <Lock className="h-4 w-4" /> Actualizar Contraseña
                </button>
              </div>
            </div>
          )}

          {/* ─── NOTIFICACIONES ─── */}
          {section === 'notificaciones' && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-900">Preferencias de Notificaciones</h2>
                <p className="text-sm text-slate-500">Controla qué alertas recibes y cómo.</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  { key: 'conflictos' as const, label: 'Alertas de Conflictos', desc: 'Recibe avisos cuando el motor CSP detecte colisiones de horario.' },
                  { key: 'publicacion' as const, label: 'Publicación de Escenarios', desc: 'Notificación cuando un borrador se publique como horario oficial.' },
                  { key: 'semanal' as const, label: 'Resumen Semanal', desc: 'Un reporte de métricas enviado cada lunes por la mañana.' },
                  { key: 'email' as const, label: 'Notificaciones por Email', desc: 'Enviar también todas las alertas al correo registrado.' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{n.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                    </div>
                    <button type="button" onClick={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                      className={cn("w-11 h-6 rounded-full transition-colors shrink-0 relative", notifs[n.key] ? "bg-emerald-500" : "bg-slate-200")}>
                      <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", notifs[n.key] ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors">
                  <Save className="h-4 w-4" /> Guardar Preferencias
                </button>
              </div>
            </div>
          )}

          {/* ─── APARIENCIA ─── */}
          {section === 'apariencia' && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-900">Apariencia e Idioma</h2>
                <p className="text-sm text-slate-500">Personaliza la interfaz según tus preferencias.</p>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">Tema de Interfaz</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as const).map(t => {
                      const icons = { light: Sun, dark: Moon, system: Monitor };
                      const labels = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' };
                      const Icon = icons[t];
                      return (
                        <button key={t} type="button" onClick={() => setTheme(t)}
                          className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                            theme === t ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                          )}>
                          <Icon className={cn("h-6 w-6", theme === t ? "text-slate-900" : "text-slate-400")} />
                          <span className={cn("text-sm font-semibold", theme === t ? "text-slate-900" : "text-slate-500")}>{labels[t]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Globe className="h-4 w-4 text-slate-400" /> Idioma de la Interfaz</label>
                  <select className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors">
                  <Save className="h-4 w-4" /> Aplicar Cambios
                </button>
              </div>
            </div>
          )}

          {/* ─── SISTEMA ─── */}
          {section === 'sistema' && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-900">Configuración del Motor CSP</h2>
                <p className="text-sm text-slate-500">Parámetros avanzados para el algoritmo de optimización.</p>
              </div>
              <div className="p-6 flex flex-col gap-5">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-amber-800 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Cambios en estos parámetros afectan directamente la calidad y velocidad de la generación de horarios.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Tiempo Máximo de Búsqueda (segundos)</label>
                  <input type="number" value={cspSettings.maxTime} min={10} max={300}
                    onChange={e => setCspSettings(p => ({ ...p, maxTime: +e.target.value }))}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <p className="text-xs text-slate-400">El solucionador se detendrá al alcanzar este límite y retornará la mejor solución encontrada hasta ese momento.</p>
                </div>
                {[
                  { key: 'hardConflict' as const, label: 'Restricciones Duras (Hard Constraints)', desc: 'Nunca asignar un docente a dos clases simultáneas. No negociable.' },
                  { key: 'softConflict' as const, label: 'Restricciones Suaves (Soft Constraints)', desc: 'Preferir que los docentes no tengan huecos de más de 2 horas entre clases.' },
                  { key: 'balanceLoad' as const, label: 'Balancear Carga Docente', desc: 'Distribuir equitativamente las horas entre todos los docentes disponibles.' },
                  { key: 'preferMorning' as const, label: 'Preferir Horario Matutino', desc: 'Dar prioridad a la asignación en turnos de mañana cuando sea posible.' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-semibold text-slate-800 text-sm">{s.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                    <button type="button" onClick={() => setCspSettings(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                      className={cn("w-11 h-6 rounded-full transition-colors shrink-0 relative", cspSettings[s.key] ? "bg-emerald-500" : "bg-slate-200")}>
                      <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", cspSettings[s.key] ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors">
                  <Save className="h-4 w-4" /> Guardar Configuración
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <SaveBanner show={saved} />
    </div>
  );
}
