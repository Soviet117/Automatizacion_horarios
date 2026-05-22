'use client';

import { Teacher, Course } from './types';
import { sumTeacherLoad } from './utils';
import styles from './Interfaz.module.css';

interface TeachersPanelProps {
  teachers: Teacher[];
  courses: Course[];
  schedule: Record<string, any[]> | null;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TeachersPanel({ teachers, courses, schedule, onAdd, onEdit, onDelete }: TeachersPanelProps) {
  return (
    <section className={styles.panelSection}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.sectionTitle}>Docentes</h2>
        <button type="button" className={styles.primaryButton} onClick={onAdd}>
          <span>+</span> Agregar Docente
        </button>
      </div>
      {teachers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👩‍🏫</div>
          <p>Sin docentes aun. Haz clic en "Agregar Docente" o carga datos demo.</p>
        </div>
      ) : (
        <div className={styles.gridTwoColumns}>
          {teachers.map((teacher) => {
            const assigned = courses.filter((course) => course.teacherId === teacher.id);
            const scheduled = schedule ? Object.values(schedule).flat().filter((session) => session.teacherId === teacher.id).length : 0;
            return (
              <div key={teacher.id} className={styles.cardPanel}>
                <div className={styles.cardPanelHeader}>
                  <div>
                    <h3>{teacher.name}</h3>
                    <p className={styles.smallText}>
                      {assigned.length} materia{assigned.length !== 1 ? 's' : ''} · {scheduled} sesiones_programadas
                    </p>
                  </div>
                  <div className={styles.cardActions}>                    
                    <button type="button" className={styles.iconButton} onClick={() => onEdit(teacher.id)} title="Editar">
                      ✏️
                    </button>
                    <button type="button" className={styles.iconButton} onClick={() => onDelete(teacher.id)} title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </div>
                {assigned.length > 0 && (
                  <div className={styles.tagList}>
                    {assigned.map((course) => (
                      <span key={course.id} className={styles.tag}> {course.name} </span>
                    ))}
                  </div>
                )}
                <div className={styles.availabilityGrid}>
                  <div className={styles.availabilityHeader}></div>
                  <div className={styles.availabilityRowHeader}></div>
                  <div className={styles.availabilityCell}></div>
                </div>
                <div className={styles.smallText}>Disponibilidad personalizada disponible</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
