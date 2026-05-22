'use client';

import { FormEvent, useState } from 'react';
import styles from './Interfaz.module.css';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
  onDemoAccess: () => void;
}

const initialErrors = {
  username: '',
  password: '',
};

export default function LoginScreen({ onLoginSuccess, onDemoAccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState(initialErrors);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = { ...initialErrors };

    if (!username.trim()) {
      nextErrors.username = 'Ingresa tu usuario o correo electrónico';
    }
    if (!password) {
      nextErrors.password = 'Ingresa tu contraseña';
    }

    setErrors(nextErrors);
    return !nextErrors.username && !nextErrors.password;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(username.trim() || 'Usuario');
    }, 700);
  };

  const handleTogglePassword = () => setShowPassword((current) => !current);

  return (
    <div className={styles.loginScreen}>
      <div className={styles.loginWave} />
      <div className={styles.loginCard}>
        <div className={styles.loginLogo} aria-hidden="true">🎓</div>
        <h1 className={styles.heading}>Bienvenido</h1>
        <p className={styles.subheading}>Ingresa tus credenciales para continuar</p>

        <form className={styles.loginForm} onSubmit={handleSubmit} noValidate autoComplete="off">
          <div className={styles.loginInputWrap}>
            <span className={styles.inputIcon}>👤</span>
            <input
              id="login-user"
              type="text"
              className={`${styles.loginInput} ${errors.username ? styles.hasError : ''}`}
              placeholder="Usuario o correo electrónico"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoFocus
            />
          </div>
          <div className={`${styles.inputError} ${errors.username ? styles.visible : ''}`}>
            {errors.username}
          </div>

          <div className={styles.loginInputWrap}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              id="login-pass"
              type={showPassword ? 'text' : 'password'}
              className={`${styles.loginInput} ${errors.password ? styles.hasError : ''}`}
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className={styles.togglePw}
              onClick={handleTogglePassword}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className={`${styles.inputError} ${errors.password ? styles.visible : ''}`}>
            {errors.password}
          </div>

          <div className={styles.formFooterRow}>
            <label className={styles.customCheck}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span className={styles.checkboxBox}>{rememberMe && <span className={styles.checkboxIcon}>✓</span>}</span>
              Recordarme
            </label>
            <button type="button" className={styles.loginLink}>
              Olvidé mi contraseña
            </button>
          </div>

          <button type="submit" className={`${styles.loginBtn} ${loading ? styles.loading : ''}`}>
            <span className={styles.btnText}>Iniciar sesión</span>
            {loading && <span className={styles.spinner} aria-hidden="true" />}
          </button>
        </form>

        <div className={styles.dividerRow}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>o accede como</span>
          <div className={styles.dividerLine} />
        </div>

        <button type="button" className={styles.demoButton} onClick={onDemoAccess}>
          🚀 Acceso rápido de demostración
        </button>

        <p className={styles.footerText}>Sistema Inteligente de Horarios Académicos v2.0</p>
      </div>
    </div>
  );
}
