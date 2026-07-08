'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Mail, Eye, EyeOff, GraduationCap, UserPlus, Check, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import s from '../login/login.module.css';

const initialErrors = {
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState(initialErrors);
  const [loadingForm, setLoadingForm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verificación de email
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [resending, setResending] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const validate = () => {
    const nextErrors = { ...initialErrors };

    if (!name.trim()) nextErrors.name = 'Ingresa tu nombre completo';
    if (!username.trim()) nextErrors.username = 'Ingresa tu correo electrónico';
    if (!password) nextErrors.password = 'Ingresa tu contraseña';
    if (password.length < 6) nextErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirma tu contraseña';
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!emailVerified) nextErrors.username = 'Debes verificar tu correo primero';

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSendCode = async () => {
    if (!username.trim()) {
      setErrors(prev => ({ ...prev, username: 'Ingresa tu correo primero' }));
      return;
    }
    setSendingCode(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || 'Error al enviar código');
      } else {
        setCodeSent(true);
        setShowVerifyModal(true);
        setVerificationCode('');
      }
    } catch {
      setVerifyError('Error de conexión');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length < 6) return;
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || 'Código incorrecto');
      } else {
        setEmailVerified(true);
        setShowVerifyModal(false);
        setCodeSent(false);
        setErrors(prev => ({ ...prev, username: '' }));
      }
    } catch {
      setVerifyError('Error de conexión');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username }),
      });
      const data = await res.json();
      if (!res.ok) setVerifyError(data.error || 'Error al reenviar');
    } catch {
      setVerifyError('Error de conexión');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError('');
    setSuccess(false);
    if (!validate()) return;

    setLoadingForm(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Ocurrió un error');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch {
      setServerError('Error de conexión con el servidor');
    } finally {
      setLoadingForm(false);
    }
  };

  if (loading || user) return null;

  if (success) {
    return (
      <div className={s.wrapper}>
        <div className={s.brandSide}>
          <div className={s.brandLogo}>
            <div className={s.logoIcon}>
              <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span>Optimizer EIS</span>
          </div>
          <div className={s.brandContent}>
            <h1 className={s.brandTitle}>Gestión Inteligente de Horarios Universitarios</h1>
            <p className={s.brandDesc}>Optimiza la asignación de aulas, disponibilidad docente y distribución de cohortes mediante motores de resolución CSP de última generación sin conflictos.</p>
          </div>
          <div className={s.brandFooter}>&copy; 2026 Optimizer Academic Suite. Todos los derechos reservados.</div>
        </div>
        <div className={s.formSide}>
          <div className={s.formContainer}>
            <div className={s.formHeader}>
              <h2 className={s.formTitle}>¡Registro exitoso!</h2>
              <p className={s.formSubtitle}>Tu cuenta ha sido creada correctamente. Serás redirigido al inicio de sesión...</p>
            </div>
            <Link href="/login" className={s.submitBtn} style={{ textDecoration: 'none', display: 'flex' }}>
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <div className={s.brandSide}>
        <div className={s.brandLogo}>
          <div className={s.logoIcon}>
            <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span>Optimizer EIS</span>
        </div>
        <div className={s.brandContent}>
          <h1 className={s.brandTitle}>Gestión Inteligente de Horarios Universitarios</h1>
          <p className={s.brandDesc}>Optimiza la asignación de aulas, disponibilidad docente y distribución de cohortes mediante motores de resolución CSP de última generación sin conflictos.</p>
        </div>
        <div className={s.brandFooter}>&copy; 2026 Optimizer Academic Suite. Todos los derechos reservados.</div>
      </div>

      <div className={s.formSide}>
        <div className={s.formContainer}>
          <div className={s.formHeader}>
            <h2 className={s.formTitle}>Crear cuenta</h2>
            <p className={s.formSubtitle}>Regístrate para acceder al sistema de gestión de horarios</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Nombre Completo</label>
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}>
                  <User size={18} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  className={`${s.formInput} ${errors.name ? s.formInputError : ''}`}
                  placeholder="Dr. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              {errors.name && <p className={s.errorMsg}>{errors.name}</p>}
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>Correo Institucional</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span className={s.inputIcon} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                    <Mail size={18} strokeWidth={2} />
                  </span>
                  <input
                    type="email"
                    className={`${s.formInput} ${errors.username ? s.formInputError : ''}`}
                    style={{ paddingLeft: 40, paddingRight: emailVerified ? 40 : 12 }}
                    placeholder="ejemplo@universidad.edu"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setEmailVerified(false); }}
                  />
                  {emailVerified && (
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }}>
                      <Check size={18} strokeWidth={2.5} />
                    </span>
                  )}
                </div>
                {emailVerified ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 12px', background: '#f0fdf4', color: '#16a34a', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', border: '1px solid #bbf7d0', height: 44 }}>
                    <Check size={14} strokeWidth={2.5} /> Verificado
                  </span>
                ) : (
                  <button type="button" onClick={handleSendCode} disabled={sendingCode || !username.trim()} style={{
                    padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: (sendingCode || !username.trim()) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 600, color: (sendingCode || !username.trim()) ? '#94a3b8' : '#475569', whiteSpace: 'nowrap', height: 44, transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (!sendingCode && username.trim()) e.currentTarget.style.borderColor = '#10b981'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                    {sendingCode ? 'Enviando...' : 'Verificar'}
                  </button>
                )}
              </div>
              {errors.username && <p className={s.errorMsg}>{errors.username}</p>}
              {verifyError && <p className={s.errorMsg} style={{ color: '#dc2626' }}>{verifyError}</p>}
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>Contraseña</label>
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}>
                  <Lock size={18} strokeWidth={2} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`${s.formInput} ${s.passwordInput} ${errors.password ? s.formInputError : ''}`}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={s.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
              {errors.password && <p className={s.errorMsg}>{errors.password}</p>}
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>Confirmar Contraseña</label>
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}>
                  <Lock size={18} strokeWidth={2} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`${s.formInput} ${s.passwordInput} ${errors.confirmPassword ? s.formInputError : ''}`}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={s.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
              {errors.confirmPassword && <p className={s.errorMsg}>{errors.confirmPassword}</p>}
            </div>

            {serverError && (
              <div className={s.serverError}>{serverError}</div>
            )}

            <button type="submit" disabled={loadingForm} className={s.submitBtn}>
              {loadingForm ? (
                <>
                  <span className={s.spinner}></span>
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} strokeWidth={2} />
                  <span>Crear Cuenta</span>
                </>
              )}
            </button>
          </form>

          <div className={s.infoNotice}>
            <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>🔐</span>
            <div>
              <strong>¿Ya tienes una cuenta?</strong>
              <Link href="/login" style={{ color: '#02b078', fontWeight: 600, textDecoration: 'none' }}>
                Inicia sesión aquí
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── VERIFICACIÓN MODAL ── */}
      {showVerifyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'white', borderRadius: 18, padding: 32, width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button type="button" onClick={() => { setShowVerifyModal(false); setVerificationCode(''); setVerifyError(''); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
              <X size={18} strokeWidth={2} />
            </button>

            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Verifica tu correo</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Ingresa el código de 6 dígitos enviado a <strong>{username}</strong>
            </div>

            {codeSent && (
              <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 12, color: '#16a34a', marginBottom: 16, alignItems: 'center' }}>
                <Check size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} /> Código enviado
              </div>
            )}

            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              autoFocus
              style={{
                width: '100%', padding: '14px', border: '1.5px solid #e2e8f0', borderRadius: 11,
                fontSize: 28, fontWeight: 800, color: '#0f172a', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', textAlign: 'center', letterSpacing: 10, background: '#f8fafc',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
            />

            {verifyError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#dc2626', marginTop: 12 }}>
                <AlertTriangle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                {verifyError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => handleResendCode()} disabled={resending} style={{
                flex: 1, padding: '11px 0', borderRadius: 11, border: '1px solid #e2e8f0', background: 'white', cursor: resending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 600, color: resending ? '#94a3b8' : '#475569',
              }}>
                {resending ? 'Reenviando...' : 'Reenviar código'}
              </button>
              <button type="button" onClick={handleVerifyCode} disabled={verifying || verificationCode.length < 6} style={{
                flex: 1, padding: '11px 0', borderRadius: 11, border: 'none', background: '#0f172a', color: 'white', cursor: (verifying || verificationCode.length < 6) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 700, opacity: (verifying || verificationCode.length < 6) ? 0.5 : 1,
              }}>
                {verifying ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
