'use client';

import styles from './Interfaz.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

export default function Modal({ open, title, onClose, onSubmit, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Cerrar modal">
            ×
          </button>
        </div>
        <form className={styles.modalForm} onSubmit={onSubmit}>
          <div className={styles.modalBody}>{children}</div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.modalCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.modalSubmit}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
