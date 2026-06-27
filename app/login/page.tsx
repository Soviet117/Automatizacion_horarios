'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, GraduationCap } from 'lucide-react';
import s from './login.module.css';

const initialErrors = {
  username: '',
  password: '',
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState(initialErrors);
  const [loadingForm, setLoadingForm] = useState(false);
  const [serverError, setServerError] = useState('');
  
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const validate = () => {
    const nextErrors = { ...initialErrors };

    if (!username.trim()) nextErrors.username = 'Ingresa tu correo electrónico';
    if (!password) nextErrors.password = 'Ingresa tu contraseña';

    setErrors(nextErrors);
    return !nextErrors.username && !nextErrors.password;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;
    
    setLoadingForm(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Ocurrió un error');
      } else {
        login({ username: data.username || data.id, name: data.name, role: data.role || 'user' });
      }
    } catch {
      setServerError('Error de conexión con el servidor');
    } finally {
      setLoadingForm(false);
    }
  };

  if (loading || user) return null;

  return (
    <div className={s.wrapper}>
      {/* ── LEFT PANEL ── */}
      <div className={s.brandSide}>
        <div className={s.brandLogo}>
          <div className={s.logoIcon}>
            <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span>Optimizer EIS</span>
        </div>

        <div className={s.brandContent}>
          <h1 className={s.brandTitle}>
            Gestión Inteligente de Horarios Universitarios
          </h1>
          <p className={s.brandDesc}>
            Optimiza la asignación de aulas, disponibilidad docente y distribución de cohortes mediante motores de resolución CSP de última generación sin conflictos.
          </p>
        </div>

        <div className={s.brandFooter}>
          &copy; 2026 Optimizer Academic Suite. Todos los derechos reservados.
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={s.formSide}>
        <div className={s.formContainer}>
          <div className={s.formHeader}>
            <h2 className={s.formTitle}>Bienvenido de nuevo</h2>
            <p className={s.formSubtitle}>Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className={s.formGroup}>
              <label className={s.formLabel}>
                Usuario o Correo Institucional
              </label>
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}>
                  <User size={18} strokeWidth={2} />
                </span>
                <input
                  type="email"
                  className={`${s.formInput} ${errors.username ? s.formInputError : ''}`}
                  placeholder="ejemplo@universidad.edu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              {errors.username && <p className={s.errorMsg}>{errors.username}</p>}
            </div>

            {/* Password */}
            <div className={s.formGroup}>
              <label className={s.formLabel}>
                Contraseña
              </label>
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}>
                  <Lock size={18} strokeWidth={2} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`${s.formInput} ${s.passwordInput} ${errors.password ? s.formInputError : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={s.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword
                    ? <EyeOff size={18} strokeWidth={2} />
                    : <Eye size={18} strokeWidth={2} />
                  }
                </button>
              </div>
              {errors.password && <p className={s.errorMsg}>{errors.password}</p>}
            </div>

            {serverError && (
              <div className={s.serverError}>{serverError}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loadingForm}
              className={s.submitBtn}
            >
              {loadingForm ? (
                <>
                  <span className={s.spinner}></span>
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Info Notice */}
          <div className={s.infoNotice}>
            <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>💡</span>
            <div>
              <strong>¿No posees una cuenta activa?</strong>
              Este sistema está restringido exclusivamente a coordinadores y administradores. Solicita tu acceso directamente con el departamento de TI de tu facultad.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}