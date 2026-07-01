'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Mail, Eye, EyeOff, GraduationCap, UserPlus } from 'lucide-react';
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

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
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
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}>
                  <Mail size={18} strokeWidth={2} />
                </span>
                <input
                  type="email"
                  className={`${s.formInput} ${errors.username ? s.formInputError : ''}`}
                  placeholder="ejemplo@universidad.edu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              {errors.username && <p className={s.errorMsg}>{errors.username}</p>}
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
    </div>
  );
}
