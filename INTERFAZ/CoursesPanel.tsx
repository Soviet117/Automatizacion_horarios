'use client';

import { Course, Teacher } from './types';
import { typeBadge } from './utils';
import styles from './Interfaz.module.css';

interface CoursesPanelProps {
  courses: Course[];
  teachers: Teacher[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CoursesPanel({ courses, teachers, onAdd, onEdit, onDelete }: CoursesPanelProps) {
  return (
    <section className={styles.panelSection}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.sectionTitle}>Materias</h2>
        <button type="button" className={styles.primaryButton} onClick={onAdd}>
          <span>+</span> Agregar Materia
        </button>
      </div>
      {courses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <p>Sin materias aun. Haz clic en "Agregar Materia" o carga datos demo.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Tipo</th>
                <th>Programa</th>
                <th>Sem</th>
                <th>Teoría</th>
                <th>Práctica</th>
                <th>Alumnos</th>
                <th>Docente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className={styles.dataRow}>
                  <td>{course.name}</td>
                  <td>{typeBadge(course.type)}</td>
                  <td>{course.program}</td>
                  <td className={styles.centerCell}>{course.semester}</td>
                  <td className={styles.centerCell}>{course.theoreticalHours}</td>
                  <td className={styles.centerCell}>{course.practicalHours}</td>
                  <td className={styles.centerCell}>{course.students}</td>
                  <td>{teachers.find((t) => t.id === course.teacherId)?.name ?? 'Sin asignar'}</td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.iconButton} onClick={() => onEdit(course.id)} title="Editar">
                      ✏️
                    </button>
                    <button type="button" className={styles.iconButton} onClick={() => onDelete(course.id)} title="Eliminar">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
