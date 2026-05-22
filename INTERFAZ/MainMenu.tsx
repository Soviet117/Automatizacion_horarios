'use client';

import { FormEvent, useMemo, useState } from 'react';
import Modal from './Modal';
import Toast from './Toast';
import { Course, Teacher, Classroom, Conflict, ToastMessage } from './types';
import { DAYS, DAY_SHORT, SLOTS, COURSE_TYPES, ROOM_TYPES, PROGRAMS, sampleCourses, sampleTeachers, sampleClassrooms } from './data';
import { generateSchedule, detectConflicts } from './scheduler';
import { typeBadge, roomBadge, sumRoomUsage, sumTeacherLoad } from './utils';
import styles from './Interfaz.module.css';

type AppTab = 'dashboard' | 'courses' | 'teachers' | 'classrooms' | 'schedule';
type ModalType = 'course' | 'teacher' | 'classroom' | null;

const emptyAvail: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getUsageWidthClass(pct: number) {
  const value = Math.min(100, Math.max(0, Math.round(pct / 10) * 10));
  return `usageWidth${value}` as keyof typeof styles;
}

function getLegendDotClass(type: string) {
  return `legendDot_${type}` as keyof typeof styles;
}

function getSessionVariantClass(type?: string) {
  return `sessionVariant_${type ?? 'theoretical'}` as keyof typeof styles;
}

interface MainMenuProps {
  username: string;
  onLogout: () => void;
}

export default function MainMenu({ username, onLogout }: MainMenuProps) {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schedule, setSchedule] = useState<Record<string, any[]> | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempAvailability, setTempAvailability] = useState<Record<number, number[]>>(emptyAvail);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  const totalSessions = schedule ? Object.values(schedule).flat().length : 0;
  const theorySessions = schedule ? Object.values(schedule).flat().filter((session) => session.sessionType === 'theoretical').length : 0;
  const practiceSessions = totalSessions - theorySessions;
  const roomUtilization = schedule ? `${new Set(Object.values(schedule).flat().map((session) => session.roomId)).size}/${classrooms.length || 1}` : '—';
  const teacherLoad = schedule && teachers.length
    ? `${Math.min(...teachers.map((teacher) => sumTeacherLoad(schedule, teacher.id)))}–${Math.max(...teachers.map((teacher) => sumTeacherLoad(schedule, teacher.id)))} sesiones`
    : '—';

  const filteredSchedule = useMemo(() => {
    if (!schedule || scheduleFilter === 'all') return schedule;
    return Object.fromEntries(
      Object.entries(schedule).map(([key, sessions]) => [
        key,
        sessions.filter((session) => {
          const course = courses.find((c) => c.id === session.courseId);
          return course?.program === scheduleFilter;
        }),
      ])
    );
  }, [schedule, scheduleFilter, courses]);

  const toast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = createId();
    setToastMessages((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setToastMessages((current) => current.filter((item) => item.id !== id)), 4200);
  };

  const openModal = (type: ModalType, id: string | null = null) => {
    setModalType(type);
    setEditingId(id);
    setModalOpen(true);
    if (type === 'teacher' && id) {
      const teacher = teachers.find((item) => item.id === id);
      setTempAvailability(teacher?.availability ?? emptyAvail);
    } else if (type === 'teacher') {
      setTempAvailability(emptyAvail);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setEditingId(null);
    setTempAvailability(emptyAvail);
  };

  const handleLoadSample = () => {
    setCourses(sampleCourses());
    setTeachers(sampleTeachers());
    setClassrooms(sampleClassrooms());
    setSchedule(null);
    setConflicts([]);
    toast('Datos de demostración cargados correctamente', 'success');
  };

  const handleResetAll = () => {
    setCourses([]);
    setTeachers([]);
    setClassrooms([]);
    setSchedule(null);
    setConflicts([]);
    setScheduleFilter('all');
    toast('Todos los datos han sido reiniciados', 'info');
  };

  const handleGenerate = (shuffle = false) => {
    if (courses.length === 0 || teachers.length === 0 || classrooms.length === 0) {
      toast('Agrega materias, docentes y aulas antes de generar el horario', 'warning');
      return;
    }
    const result = generateSchedule(courses, teachers, classrooms, shuffle);
    const fullConflicts = detectConflicts(result.schedule, courses, teachers, classrooms);
    setSchedule(result.schedule);
    setConflicts(fullConflicts);
    if (fullConflicts.filter((item) => item.severity === 'error').length === 0) {
      toast('Horario generado exitosamente — sin conflictos', 'success');
    } else {
      toast(`Horario generado con ${fullConflicts.filter((item) => item.severity === 'error').length} conflicto(s)`, 'warning');
    }
    setActiveTab('schedule');
  };

  const handleClearSchedule = () => {
    setSchedule(null);
    setConflicts([]);
    toast('Horario limpiado', 'info');
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((current) => current.filter((item) => item.id !== id));
    setSchedule(null);
    setConflicts([]);
    toast('Materia eliminada', 'info');
  };

  const handleDeleteTeacher = (id: string) => {
    setCourses((current) => current.map((course) => (course.teacherId === id ? { ...course, teacherId: '' } : course)));
    setTeachers((current) => current.filter((item) => item.id !== id));
    setSchedule(null);
    setConflicts([]);
    toast('Docente eliminado', 'info');
  };

  const handleDeleteClassroom = (id: string) => {
    setClassrooms((current) => current.filter((item) => item.id !== id));
    setSchedule(null);
    setConflicts([]);
    toast('Aula eliminada', 'info');
  };

  const handleModalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (modalType === 'course') {
      const data = {
        name: String(formData.get('name') ?? '').trim(),
        type: String(formData.get('type') ?? 'theoretical') as Course['type'],
        program: String(formData.get('program') ?? '').trim(),
        semester: Number(formData.get('semester') ?? 1),
        theoreticalHours: Number(formData.get('theoreticalHours') ?? 0),
        practicalHours: Number(formData.get('practicalHours') ?? 0),
        students: Number(formData.get('students') ?? 1),
        teacherId: String(formData.get('teacherId') ?? ''),
      };

      if (!data.name || !data.program || !data.teacherId) {
        toast('Completa todos los campos de la materia', 'warning');
        return;
      }

      if (data.theoreticalHours + data.practicalHours === 0) {
        toast('La materia debe tener al menos 1 hora', 'warning');
        return;
      }

      if (editingId) {
        setCourses((current) => current.map((item) => (item.id === editingId ? { ...item, ...data } : item)));
        toast('Materia actualizada', 'success');
      } else {
        setCourses((current) => [...current, { id: createId(), ...data }]);
        toast('Materia agregada', 'success');
      }

      setSchedule(null);
      setConflicts([]);
      closeModal();
      return;
    }

    if (modalType === 'teacher') {
      const name = String(formData.get('name') ?? '').trim();
      if (!name) {
        toast('El nombre del docente es obligatorio', 'warning');
        return;
      }
      const availability = { ...tempAvailability };
      if (editingId) {
        setTeachers((current) => current.map((item) => (item.id === editingId ? { ...item, name, availability } : item)));
        toast('Docente actualizado', 'success');
      } else {
        setTeachers((current) => [...current, { id: createId(), name, availability }]);
        toast('Docente agregado', 'success');
      }
      setSchedule(null);
      setConflicts([]);
      closeModal();
      return;
    }

    if (modalType === 'classroom') {
      const data = {
        name: String(formData.get('name') ?? '').trim(),
        type: String(formData.get('type') ?? 'classroom') as Classroom['type'],
        capacity: Number(formData.get('capacity') ?? 1),
      };
      if (!data.name) {
        toast('El nombre del aula es obligatorio', 'warning');
        return;
      }
      if (editingId) {
        setClassrooms((current) => current.map((item) => (item.id === editingId ? { ...item, ...data } : item)));
        toast('Aula actualizada', 'success');
      } else {
        setClassrooms((current) => [...current, { id: createId(), ...data }]);
        toast('Aula agregada', 'success');
      }
      setSchedule(null);
      setConflicts([]);
      closeModal();
      return;
    }
  };

  const handleAvailToggle = (day: number, slot: number) => {
    setTempAvailability((current) => {
      const next = { ...current, [day]: [...(current[day] || [])] };
      const index = next[day].indexOf(slot);
      if (index >= 0) {
        next[day].splice(index, 1);
      } else {
        next[day].push(slot);
      }
      return next;
    });
  };

  const editingItem = useMemo(() => {
    if (!modalType || !editingId) return null;
    if (modalType === 'course') return courses.find((item) => item.id === editingId) ?? null;
    if (modalType === 'teacher') return teachers.find((item) => item.id === editingId) ?? null;
    if (modalType === 'classroom') return classrooms.find((item) => item.id === editingId) ?? null;
    return null;
  }, [editingId, modalType, courses, teachers, classrooms]);

  const currentEditionName = () => {
    if (!modalType) return '';
    if (modalType === 'course') return editingId ? 'Editar Materia' : 'Agregar Materia';
    if (modalType === 'teacher') return editingId ? 'Editar Docente' : 'Agregar Docente';
    if (modalType === 'classroom') return editingId ? 'Editar Aula' : 'Agregar Aula';
    return '';
  };

  const renderModalBody = () => {
    if (!modalType) return null;

    if (modalType === 'course') {
      const course = editingItem as Course | null;
      return (
        <div className={styles.modalGrid}>
          <label className={styles.formLabel}>
            Nombre de la Materia
            <input name="name" defaultValue={course?.name ?? ''} className={styles.formInput} required />
          </label>
          <label className={styles.formLabel}>
            Tipo
            <select name="type" defaultValue={course?.type ?? 'theoretical'} className={styles.formInput}>
              {COURSE_TYPES.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.formLabel}>
            Programa
            <select name="program" defaultValue={course?.program ?? PROGRAMS[0]} className={styles.formInput}>
              {PROGRAMS.map((program) => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </label>
          <label className={styles.formLabel}>
            Semestre
            <input name="semester" type="number" min={1} max={12} defaultValue={course?.semester ?? 1} className={styles.formInput} required />
          </label>
          <label className={styles.formLabel}>
            Horas Teoría
            <input name="theoreticalHours" type="number" min={0} max={6} defaultValue={course?.theoreticalHours ?? 0} className={styles.formInput} required />
          </label>
          <label className={styles.formLabel}>
            Horas Práctica
            <input name="practicalHours" type="number" min={0} max={6} defaultValue={course?.practicalHours ?? 0} className={styles.formInput} required />
          </label>
          <label className={styles.formLabel}>
            Alumnos
            <input name="students" type="number" min={1} max={200} defaultValue={course?.students ?? 1} className={styles.formInput} required />
          </label>
          <label className={styles.formLabel}>
            Docente
            <select name="teacherId" defaultValue={course?.teacherId ?? ''} className={styles.formInput} required>
              <option value="">— Seleccionar Docente —</option>
              {teachers.map((teacher) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    }

    if (modalType === 'teacher') {
      const teacher = editingItem as Teacher | null;
      return (
        <div className={styles.modalGrid}>
          <label className={styles.formLabel}>
            Nombre Completo
            <input name="name" defaultValue={teacher?.name ?? ''} className={styles.formInput} required />
          </label>
          <div className={styles.formLabel}>
            Disponibilidad Semanal
            <div className={styles.availGrid}>
              <div className={styles.availGridHeader}>
                <span></span>
                {SLOTS.map((slot) => (
                  <span key={slot.short} className={styles.availGridLabel}>{slot.short}</span>
                ))}
              </div>
              {DAY_SHORT.map((day, dayIndex) => (
                <div key={day} className={styles.availRow}>
                  <span className={styles.availDay}>{day}</span>
                  {SLOTS.map((_, slotIndex) => {
                    const active = tempAvailability[dayIndex]?.includes(slotIndex);
                    return (
                      <button
                        type="button"
                        className={`${styles.availButton} ${active ? styles.availOn : styles.availOff}`}
                        key={`${dayIndex}-${slotIndex}`}
                        onClick={() => handleAvailToggle(dayIndex, slotIndex)}
                      >
                        {active ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className={styles.helpText}>Haz clic para activar o desactivar bloques.</p>
          </div>
        </div>
      );
    }

    if (modalType === 'classroom') {
      const room = editingItem as Classroom | null;
      return (
        <div className={styles.modalGrid}>
          <label className={styles.formLabel}>
            Nombre de Aula
            <input name="name" defaultValue={room?.name ?? ''} className={styles.formInput} required />
          </label>
          <label className={styles.formLabel}>
            Tipo de Aula
            <select name="type" defaultValue={room?.type ?? 'classroom'} className={styles.formInput}>
              {ROOM_TYPES.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.formLabel}>
            Capacidad
            <input name="capacity" type="number" min={1} max={300} defaultValue={room?.capacity ?? 30} className={styles.formInput} required />
          </label>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.appWrapper}>
      {showWelcome && (
        <section className={styles.welcomeBanner}>
          <div className={styles.bannerContent}>
            <p className={styles.bannerText}>✨ Hola, {username.split(' ')[0]} — tu panel está listo.</p>
            <button type="button" className={styles.bannerClose} onClick={() => setShowWelcome(false)}>
              Cerrar
            </button>
          </div>
        </section>
      )}

      <header className={styles.appHeader}>
        <div>
          <h1 className={styles.headerTitle}>Horarios Académicos</h1>
          <p className={styles.headerSubtitle}>Generación inteligente de horarios sin conflictos.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.userBadge}>
            <span className={styles.userAvatar}>{username.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
            <span>{username}</span>
          </div>
          <button type="button" className={styles.headerButton} onClick={handleLoadSample}>
            Cargar Demo
          </button>
          <button type="button" className={styles.dangerButton} onClick={handleResetAll}>
            Reiniciar
          </button>
          <button type="button" className={styles.headerButton} onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className={styles.tabBar}>
        {(['dashboard', 'courses', 'teachers', 'classrooms', 'schedule'] as AppTab[]).map((tab) => (
          <button
            type="button"
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'dashboard' ? 'Panel' : tab === 'courses' ? 'Materias' : tab === 'teachers' ? 'Docentes' : tab === 'classrooms' ? 'Aulas' : 'Horario'}
          </button>
        ))}
      </nav>

      <main className={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <section className={styles.dashboardSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHead}>Materias</div>
                <div className={styles.statValue}>{courses.length}</div>
                <div className={styles.statCaption}>{PROGRAMS.length} programas</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHead}>Docentes</div>
                <div className={styles.statValue}>{teachers.length}</div>
                <div className={styles.statCaption}>{teacherLoad}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHead}>Aulas</div>
                <div className={styles.statValue}>{classrooms.length}</div>
                <div className={styles.statCaption}>{roomUtilization}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHead}>Programadas</div>
                <div className={styles.statValue}>{totalSessions}</div>
                <div className={styles.statCaption}>{theorySessions} teoría / {practiceSessions} práctica</div>
              </div>
            </div>
            <div className={styles.actionCard}>
              <h2>Acciones Rápidas</h2>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.primaryButton} onClick={() => handleGenerate(false)}>
                  Generar Horario
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleLoadSample}>
                  Cargar Datos Demo
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => setActiveTab('schedule')} disabled={!schedule}>
                  Ver Horario
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'courses' && (
          <section className={styles.sectionPanel}>
            <div className={styles.panelHeaderRow}>
              <h2 className={styles.sectionTitle}>Materias</h2>
              <button type="button" className={styles.primaryButton} onClick={() => openModal('course')}>
                + Agregar Materia
              </button>
            </div>
            {courses.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📘</div>
                <p>Sin materias aun. Agrega una materia o carga datos demo.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Materia</th>
                      <th>Tipo</th>
                      <th>Programa</th>
                      <th className={styles.centerCell}>Sem</th>
                      <th className={styles.centerCell}>Teoría</th>
                      <th className={styles.centerCell}>Práctica</th>
                      <th className={styles.centerCell}>Alumnos</th>
                      <th>Docente</th>
                      <th className={styles.actionsCell}>Acciones</th>
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
                        <td>{teachers.find((teacher) => teacher.id === course.teacherId)?.name ?? 'Sin asignar'}</td>
                        <td className={styles.actionsCell}>
                          <button type="button" className={styles.iconButton} onClick={() => openModal('course', course.id)}>
                            ✏️
                          </button>
                          <button type="button" className={styles.iconButton} onClick={() => handleDeleteCourse(course.id)}>
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
        )}

        {activeTab === 'teachers' && (
          <section className={styles.sectionPanel}>
            <div className={styles.panelHeaderRow}>
              <h2 className={styles.sectionTitle}>Docentes</h2>
              <button type="button" className={styles.primaryButton} onClick={() => openModal('teacher')}>
                + Agregar Docente
              </button>
            </div>
            {teachers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👩‍🏫</div>
                <p>Sin docentes aun. Agrega un docente o carga datos demo.</p>
              </div>
            ) : (
              <div className={styles.gridTwoColumns}>
                {teachers.map((teacher) => {
                  const assigned = courses.filter((course) => course.teacherId === teacher.id);
                  const scheduled = schedule ? Object.values(schedule).flat().filter((session) => session.teacherId === teacher.id).length : 0;
                  return (
                    <article key={teacher.id} className={styles.cardPanel}>
                      <div className={styles.cardPanelHeader}>
                        <div>
                          <h3>{teacher.name}</h3>
                          <p className={styles.smallText}>{assigned.length} materia{assigned.length !== 1 ? 's' : ''} · {scheduled} sesiones</p>
                        </div>
                        <div>
                          <button type="button" className={styles.iconButton} onClick={() => openModal('teacher', teacher.id)}>
                            ✏️
                          </button>
                          <button type="button" className={styles.iconButton} onClick={() => handleDeleteTeacher(teacher.id)}>
                            🗑️
                          </button>
                        </div>
                      </div>
                      {assigned.length > 0 && (
                        <div className={styles.tagList}>
                          {assigned.map((course) => (
                            <span key={course.id} className={styles.tag}>{course.name}</span>
                          ))}
                        </div>
                      )}
                      <div className={styles.smallText}>Disponibilidad personalizada editable</div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'classrooms' && (
          <section className={styles.sectionPanel}>
            <div className={styles.panelHeaderRow}>
              <h2 className={styles.sectionTitle}>Aulas y Laboratorios</h2>
              <button type="button" className={styles.primaryButton} onClick={() => openModal('classroom')}>
                + Agregar Aula
              </button>
            </div>
            {classrooms.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🚪</div>
                <p>Sin aulas aun. Agrega un aula o carga datos demo.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Aula</th>
                      <th>Tipo</th>
                      <th className={styles.centerCell}>Capacidad</th>
                      <th className={styles.centerCell}>Uso</th>
                      <th className={styles.actionsCell}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.map((room) => {
                      const used = schedule ? sumRoomUsage(schedule, room.id) : 0;
                      const pct = Math.round((used / 25) * 100);
                      return (
                        <tr key={room.id} className={styles.dataRow}>
                          <td>{room.name}</td>
                          <td>{roomBadge(room.type)}</td>
                          <td className={styles.centerCell}>{room.capacity}</td>
                          <td className={styles.centerCell}>
                            <div className={styles.usageBarWrapper}>
                              <div className={`${styles.usageBar} ${styles[getUsageWidthClass(pct)]}`} />
                            </div>
                            <span className={styles.usageText}>{used}/25</span>
                          </td>
                          <td className={styles.actionsCell}>
                            <button type="button" className={styles.iconButton} onClick={() => openModal('classroom', room.id)}>
                              ✏️
                            </button>
                            <button type="button" className={styles.iconButton} onClick={() => handleDeleteClassroom(room.id)}>
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === 'schedule' && (
          <section className={styles.sectionPanel}>
            <div className={styles.panelHeaderRow}>
              <h2 className={styles.sectionTitle}>Horario Generado</h2>
              <div className={styles.inlineControls}>
                <select aria-label="Filtrar programa" value={scheduleFilter} onChange={(event) => setScheduleFilter(event.target.value)} className={styles.formInput}>
                  <option value="all">Todos los Programas</option>
                  {PROGRAMS.map((program) => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
                <button type="button" className={styles.secondaryButton} onClick={() => handleGenerate(false)}>
                  Generar
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => handleGenerate(true)}>
                  Regenerar
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleClearSchedule}>
                  Limpiar
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>
                  Imprimir
                </button>
              </div>
            </div>
            {!schedule ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📆</div>
                <p>Sin horario generado aún. Usa el botón Generar para crear uno.</p>
              </div>
            ) : (
              <div className={styles.scheduleWrapper}>
                  <div className={styles.scheduleLegend}>
                  {COURSE_TYPES.map((item) => (
                    <span key={item.value} className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles[`legendDot_${item.value}` as keyof typeof styles]}`} />
                      {item.label}
                    </span>
                  ))}
                </div>
                <div className={styles.scheduleTableWrapper}>
                  <div className={styles.scheduleTable}>
                    <div className={styles.scheduleRowHeader}>
                      <div>Hora</div>
                      {DAY_SHORT.map((day) => (
                        <div key={day}>{day}</div>
                      ))}
                    </div>
                    {SLOTS.map((slot, slotIndex) => (
                      <div key={slot.short} className={styles.scheduleRow}>
                        <div className={styles.slotLabel}>{slot.label}</div>
                        {DAYS.map((_, dayIndex) => {
                          const key = `${dayIndex}-${slotIndex}`;
                          const sessions = (filteredSchedule?.[key] ?? []) as any[];
                          return (
                            <div key={key} className={styles.scheduleCell}>
                              {sessions.map((session) => {
                                const course = courses.find((courseItem) => courseItem.id === session.courseId);
                                const teacher = teachers.find((teacherItem) => teacherItem.id === session.teacherId);
                                const room = classrooms.find((roomItem) => roomItem.id === session.roomId);
                                const category = COURSE_TYPES.find((item) => item.value === course?.type);
                                return (
                                  <div key={`${session.courseId}-${session.roomId}`} className={`${styles.sessionCard} ${styles[getSessionVariantClass(course?.type)]}`}>
                                    <div className={styles.sessionTitle}>{course?.name}</div>
                                    <div className={styles.sessionMeta}>{room?.name ?? '—'} · {session.sessionType === 'practical' ? 'P' : 'T'}</div>
                                    <div className={styles.sessionMetaSmall}>{teacher?.name.split(' ').pop()}</div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {schedule && conflicts.length > 0 && (
              <div className={styles.conflictPanel}>
                <h3>Conflictos y advertencias ({conflicts.length})</h3>
                <div className={styles.conflictList}>
                  {conflicts.map((item) => (
                    <div key={`${item.course}-${item.message}`} className={`${styles.conflictItem} ${item.severity === 'error' ? styles.conflictError : styles.conflictWarning}`}>
                      <strong>{item.course}</strong>
                      <p>{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <Modal open={modalOpen} title={currentEditionName()} onClose={closeModal} onSubmit={handleModalSubmit}>
        {renderModalBody()}
      </Modal>
      <Toast messages={toastMessages} onDismiss={(id) => setToastMessages((current) => current.filter((item) => item.id !== id))} />
    </div>
  );
}
