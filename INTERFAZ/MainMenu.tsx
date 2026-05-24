'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import Modal from './Modal';
import Toast from './Toast';
import { Course, Teacher, Classroom, Conflict, ToastMessage, CourseTypeValue, RoomTypeValue } from './types';
import { DAYS, DAY_SHORT, SLOTS, COURSE_TYPES, ROOM_TYPES, PROGRAMS, sampleCourses, sampleTeachers, sampleClassrooms } from './data';
import { generateSchedule, detectConflicts } from './scheduler';
import { typeBadge, roomBadge, sumRoomUsage, sumTeacherLoad } from './utils';
import styles from './Interfaz.module.css';
import ExcelImport from '../app/components/ExcelImport';

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
  user: { id: string; name: string };
  onLogout: () => void;
}

export default function MainMenu({ user, onLogout }: MainMenuProps) {
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
  const [showExcelImport, setShowExcelImport] = useState(false);

  const fetchAllData = async () => {
    try {
      const [resCursos, resDocentes, resAulas, resHorarios] = await Promise.all([
        fetch(`/api/cursos?userId=${user.id}`),
        fetch(`/api/docentes?userId=${user.id}`),
        fetch(`/api/aulas?userId=${user.id}`),
        fetch(`/api/horarios?userId=${user.id}`),
      ]);

      const dataCursos = await resCursos.json();
      const dataDocentes = await resDocentes.json();
      const dataAulas = await resAulas.json();
      const dataHorarios = await resHorarios.json();

      const mappedTeachers = Array.isArray(dataDocentes) ? dataDocentes.map((t: any) => ({
        id: t.id_docente,
        name: t.ape_docente && t.ape_docente !== 'Desconocido' ? `${t.nom_docente} ${t.ape_docente}`.trim() : t.nom_docente,
        availability: t.disponibilidad || { 0: [], 1: [], 2: [], 3: [], 4: [] }
      })) : [];
      setTeachers(mappedTeachers);

      const mappedClassrooms = Array.isArray(dataAulas) ? dataAulas.map((a: any) => ({
        id: a.id_aula,
        name: a.nom_aula,
        type: (['classroom', 'computer-lab', 'workshop', 'practical-lab'].includes(a.id_tipo_aula) ? a.id_tipo_aula : 'classroom') as RoomTypeValue,
        capacity: a.capacidad
      })) : [];
      setClassrooms(mappedClassrooms);

      const mappedCourses = Array.isArray(dataCursos) ? dataCursos.map((c: any) => ({
        id: c.id_curso,
        name: c.nom_curso,
        type: (['theoretical', 'programming', 'electronics', 'nursing'].includes(c.tipo_curso) ? c.tipo_curso : 'theoretical') as CourseTypeValue,
        theoreticalHours: c.horas_teoricas || 0,
        practicalHours: c.horas_practicas || 0,
        students: c.alumnos || 0,
        program: c.carrera ? c.carrera.nom_carrera : 'General',
        semester: c.id_ciclo || 1,
        teacherId: c.id_docente || ''
      })) : [];
      setCourses(mappedCourses);

      if (dataHorarios && dataHorarios.length > 0) {
        const tempSchedule: Record<string, any[]> = {};
        for (const h of dataHorarios) {
          let dayIndex = 0;
          const dStr = h.dia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (dStr.includes("lun")) dayIndex = 0;
          else if (dStr.includes("mar")) dayIndex = 1;
          else if (dStr.includes("mie")) dayIndex = 2;
          else if (dStr.includes("jue")) dayIndex = 3;
          else if (dStr.includes("vie")) dayIndex = 4;

          let slotIndex = 0;
          const match = h.horario_inicio.match(/(\d{1,2})/);
          if (match) {
            const hr = parseInt(match[1], 10);
            if (hr >= 7 && hr < 9) slotIndex = 0;
            else if (hr >= 9 && hr < 11) slotIndex = 1;
            else if (hr >= 11 && hr < 14) slotIndex = 2;
            else if (hr >= 14 && hr < 16) slotIndex = 3;
            else if (hr >= 16 && hr < 19) slotIndex = 4;
          }

          const key = `${dayIndex}-${slotIndex}`;
          if (!tempSchedule[key]) {
            tempSchedule[key] = [];
          }
          tempSchedule[key].push({
            courseId: h.id_curso,
            teacherId: h.id_docente,
            roomId: h.id_aula,
            sessionType: h.tipo_sesion || 'theoretical'
          });
        }
        setSchedule(tempSchedule);

        const loadedConflicts = detectConflicts(tempSchedule, mappedCourses, mappedTeachers, mappedClassrooms);
        setConflicts(loadedConflicts);
      } else {
        setSchedule(null);
        setConflicts([]);
      }
    } catch (e) {
      console.error("Error al cargar datos desde API:", e);
      toast("Error de red al cargar los datos desde la base de datos", "error");
    }
  };

  useEffect(() => {
    fetch('/api/master-data')
      .then(() => fetchAllData())
      .catch((e) => console.error("Error de inicialización de datos maestros:", e));
  }, []);

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


  const handleResetAll = () => {
    if (!confirm('¿Estás seguro de reiniciar todos los datos? Se borrará todo en la base de datos.')) return;
    toast('Reiniciando base de datos...', 'info');
    fetch(`/api/horarios?userId=${user.id}`, { method: 'DELETE' })
      .then(() => Promise.all([
        fetch(`/api/cursos?userId=${user.id}`).then(res => res.json()).then(data => Promise.all(data.map((c: any) => fetch(`/api/cursos/${c.id_curso}?userId=${user.id}`, { method: 'DELETE' })))),
        fetch(`/api/docentes?userId=${user.id}`).then(res => res.json()).then(data => Promise.all(data.map((t: any) => fetch(`/api/docentes/${t.id_docente}?userId=${user.id}`, { method: 'DELETE' })))),
        fetch(`/api/aulas?userId=${user.id}`).then(res => res.json()).then(data => Promise.all(data.map((r: any) => fetch(`/api/aulas/${r.id_aula}?userId=${user.id}`, { method: 'DELETE' }))))
      ]))
      .then(() => {
        toast('Todos los datos han sido reiniciados', 'info');
        fetchAllData();
      })
      .catch(e => {
        console.error(e);
        toast('Error al reiniciar los datos', 'error');
      });
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
      toast('Horario generado localmente. ¡Haz clic en Guardar para persistirlo!', 'success');
    } else {
      toast(`Horario generado con ${fullConflicts.filter((item) => item.severity === 'error').length} conflicto(s). ¡Haz clic en Guardar para persistirlo!`, 'warning');
    }
    setActiveTab('schedule');
  };

  const handleSaveSchedule = async () => {
    if (!schedule) return;
    const sessionsList: any[] = [];
    Object.entries(schedule).forEach(([key, sessions]) => {
      const [dayIndex, slotIndex] = key.split('-').map(Number);
      sessions.forEach((session) => {
        sessionsList.push({
          courseId: session.courseId,
          teacherId: session.teacherId,
          roomId: session.roomId,
          sessionType: session.sessionType,
          day: dayIndex,
          slot: slotIndex,
          userId: user.id
        });
      });
    });

    try {
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionsList)
      });
      if (res.ok) {
        toast('Horario guardado exitosamente en la base de datos', 'success');
        fetchAllData();
      } else {
        const err = await res.json();
        toast('Error al guardar: ' + (err.error || 'Respuesta inválida'), 'error');
      }
    } catch (e) {
      toast('Error de red al guardar el horario', 'error');
    }
  };

  const handleClearSchedule = () => {
    fetch(`/api/horarios?userId=${user.id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setSchedule(null);
          setConflicts([]);
          toast('Horario limpiado en la base de datos', 'info');
        } else {
          toast('Error al limpiar el horario', 'error');
        }
      })
      .catch(() => toast('Error de red al limpiar horario', 'error'));
  };

  const handleDeleteCourse = (id: string) => {
    fetch(`/api/cursos/${id}?userId=${user.id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          toast('Materia eliminada', 'info');
          fetchAllData();
        } else {
          toast('Error al eliminar materia', 'error');
        }
      })
      .catch(() => toast('Error de red al eliminar materia', 'error'));
  };

  const handleDeleteTeacher = (id: string) => {
    fetch(`/api/docentes/${id}?userId=${user.id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          toast('Docente eliminado', 'info');
          fetchAllData();
        } else {
          toast('Error al eliminar docente', 'error');
        }
      })
      .catch(() => toast('Error de red al eliminar docente', 'error'));
  };

  const handleDeleteClassroom = (id: string) => {
    fetch(`/api/aulas/${id}?userId=${user.id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          toast('Aula eliminada', 'info');
          fetchAllData();
        } else {
          toast('Error al eliminar aula', 'error');
        }
      })
      .catch(() => toast('Error de red al eliminar aula', 'error'));
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

      const courseId = editingId || createId();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/cursos/${editingId}` : '/api/cursos';

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId, userId: user.id, ...data })
      })
      .then(res => {
        if (res.ok) {
          toast(editingId ? 'Materia actualizada' : 'Materia agregada', 'success');
          fetchAllData();
        } else {
          res.json().then(err => toast(err.error || 'Error al guardar la materia', 'error'));
        }
      })
      .catch(() => toast('Error de red al guardar la materia', 'error'));

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
      const teacherId = editingId || createId();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/docentes/${editingId}` : '/api/docentes';

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teacherId, userId: user.id, name, availability })
      })
      .then(res => {
        if (res.ok) {
          toast(editingId ? 'Docente actualizado' : 'Docente agregado', 'success');
          fetchAllData();
        } else {
          res.json().then(err => toast(err.error || 'Error al guardar el docente', 'error'));
        }
      })
      .catch(() => toast('Error de red al guardar el docente', 'error'));

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
      const classroomId = editingId || createId();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/aulas/${editingId}` : '/api/aulas';

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: classroomId, userId: user.id, ...data })
      })
      .then(res => {
        if (res.ok) {
          toast(editingId ? 'Aula actualizada' : 'Aula agregada', 'success');
          fetchAllData();
        } else {
          res.json().then(err => toast(err.error || 'Error al guardar el aula', 'error'));
        }
      })
      .catch(() => toast('Error de red al guardar el aula', 'error'));

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
            <p className={styles.bannerText}>✨ Hola, {user.name.split(' ')[0]} — tu panel está listo.</p>
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
            <span className={styles.userAvatar}>{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
            <span>{user.name}</span>
          </div>
          <button type="button" className={styles.dangerButton} onClick={handleResetAll}>
            Reiniciar
          </button>
          <button type="button" className={styles.headerButton} onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {activeTab !== 'dashboard' && (
        <div className={styles.wizardProgressContainer}>
          <div className={styles.wizardBar}>
            {['classrooms', 'teachers', 'courses', 'schedule'].map((step, idx) => {
              const labels = ['1. Aulas', '2. Docentes', '3. Materias', '4. Horario'];
              const isActive = activeTab === step;
              const stepIndex = ['classrooms', 'teachers', 'courses', 'schedule'].indexOf(activeTab);
              const isCompleted = idx < stepIndex;
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx === 3 ? '0 0 auto' : '1' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(step as AppTab)}
                    className={`${styles.wizardStepBtn} ${isActive ? styles.wizardActive : ''} ${isCompleted ? styles.wizardCompleted : ''}`}
                  >
                    {labels[idx]}
                  </button>
                  {idx < 3 && <div className={`${styles.wizardLine} ${isCompleted ? styles.wizardLineActive : ''}`} />}
                </div>
              );
            })}
          </div>
          <button type="button" className={styles.secondaryButton} onClick={() => setActiveTab('dashboard')}>
            ✖ Volver al Panel
          </button>
        </div>
      )}

      <main className={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <section className={styles.dashboardSection}>
            <div className={styles.heroGrid}>
               <button className={styles.bigHeroButton} onClick={() => setShowExcelImport(!showExcelImport)}>
                  <div className={styles.heroIcon}>📊</div>
                  <h3>Importar Excel</h3>
                  <p>Sube tus datos masivamente.</p>
               </button>
               <button className={styles.bigHeroButton} onClick={() => setActiveTab('classrooms')}>
                  <div className={styles.heroIcon}>✍️</div>
                  <h3>Agregar Manualmente</h3>
                  <p>Aulas → Materias → Docentes</p>
               </button>
               <button className={styles.bigHeroButton} onClick={() => setActiveTab('schedule')}>
                  <div className={styles.heroIcon}>📅</div>
                  <h3>Ver Horarios</h3>
                  <p>Consulta horarios ya generados.</p>
               </button>
            </div>
            
            {showExcelImport && (
              <div className={styles.excelWrapper}>
                <ExcelImport userId={user.id} onImportSuccess={fetchAllData} />
              </div>
            )}
            
            <div className={styles.statsGrid} style={{ marginTop: '2rem' }}>
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
            {courses.length > 0 && (
              <div className={styles.wizardFooter}>
                <button type="button" className={styles.primaryButton} onClick={() => setActiveTab('schedule')}>
                  Siguiente: Generar Horario ➔
                </button>
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
            {teachers.length > 0 && (
              <div className={styles.wizardFooter}>
                <button type="button" className={styles.primaryButton} onClick={() => setActiveTab('courses')}>
                  Siguiente: Materias ➔
                </button>
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
            {classrooms.length > 0 && (
              <div className={styles.wizardFooter}>
                <button type="button" className={styles.primaryButton} onClick={() => setActiveTab('teachers')}>
                  Siguiente: Docentes ➔
                </button>
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
                {schedule && (
                  <button type="button" className={styles.primaryButton} onClick={handleSaveSchedule}>
                    Guardar
                  </button>
                )}
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
