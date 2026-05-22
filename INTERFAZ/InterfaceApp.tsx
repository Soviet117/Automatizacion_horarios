'use client';

import { useState } from 'react';
import LoginScreen from './LoginScreen';
import MainMenu from './MainMenu';
import styles from './Interfaz.module.css';

export default function InterfaceApp() {
  const [username, setUsername] = useState<string | null>(null);

  const handleLoginSuccess = (user: string) => setUsername(user);
  const handleDemoAccess = () => setUsername('Usuario de demostración');
  const handleLogout = () => setUsername(null);

  return (
    <div className={styles.page}>
      {username ? (
        <MainMenu username={username} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} onDemoAccess={handleDemoAccess} />
      )}
    </div>
  );
}
