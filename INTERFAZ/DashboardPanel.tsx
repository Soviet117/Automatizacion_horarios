'use client';

import styles from './Interfaz.module.css';

interface DashboardPanelProps {
  courseCount: number;
  teacherCount: number;
  classroomCount: number;
  totalSessions: number;
  theorySessions: number;
  practiceSessions: number;
  roomUtilization: string;
  teacherLoad: string;
  hasSchedule: boolean;
  conflictCount: number;
  onGenerate: () => void;
  onLoadSample: () => void;
  onGoSchedule: () => void;
}

export default function DashboardPanel({
  courseCount,
  teacherCount,
  classroomCount,
  totalSessions,
  theorySessions,
  practiceSessions,
  roomUtilization,
  teacherLoad,
  hasSchedule,
  conflictCount,
  onGenerate,
  onLoadSample,
  onGoSchedule,
}: DashboardPanelProps) {
  return (
    <section className={styles.dashboardSection}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHead}>
            <span>Materias</span>
            <div className={styles.statIconPrimary}>📚</div>
          </div>
          <div className={styles.statValue}>{courseCount}</div>
          <p className={styles.statCaption}>Programas disponibles</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHead}>
            <span>Docentes</span>
            <div className={styles.statIconAccent}>👩‍🏫</div>
          </div>
          <div className={styles.statValue}>{teacherCount}</div>
          <p className={styles.statCaption}>{teacherLoad} carga</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHead}>
            <span>Aulas</span>
            <div className={styles.statIconInfo}>🚪</div>
          </div>
          <div className={styles.statValue}>{classroomCount}</div>
          <p className={styles.statCaption}>{roomUtilization} en uso</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHead}>
            <span>Programadas</span>
            <div className={styles.statIconSuccess}>{conflictCount > 0 ? '⚠️' : '✅'}</div>
          </div>
          <div className={styles.statValue}>{totalSessions}</div>
          <p className={styles.statCaption}>{theorySessions} teoría / {practiceSessions} práctica</p>
        </div>
      </div>

      <div className={styles.cardWide}>
        <h2>Acciones rápidas</h2>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.primaryButton} onClick={onGenerate}>
            ✨ Generar Horario
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onLoadSample}>
            📂 Cargar Datos Demo
          </button>
          <button
            type="button"
            className={`${styles.secondaryButton} ${!hasSchedule ? styles.disabledButton : ''}`}
            onClick={onGoSchedule}
            disabled={!hasSchedule}
          >
            📅 Ver Horario
          </button>
        </div>
      </div>
    </section>
  );
}
