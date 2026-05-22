'use client';

import styles from './Interfaz.module.css';
import { ToastMessage } from './types';

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div className={styles.toastContainer}>
      {messages.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <div className={styles.toastIcon} aria-hidden="true">
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⛔' : toast.type === 'warning' ? '!' : 'i'}
          </div>
          <div className={styles.toastMessage}>{toast.message}</div>
          <button className={styles.toastClose} onClick={() => onDismiss(toast.id)} aria-label="Cerrar notificación">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
