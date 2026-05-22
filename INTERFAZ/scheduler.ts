'use client';

import { COURSE_TYPES } from './data';
import { Course, Teacher, Classroom, ScheduleState, Conflict } from './types';

function getRequiredRoomType(courseType: string, sessionType: string) {
  if (sessionType === 'theoretical') return 'classroom';
  switch (courseType) {
    case 'programming':
      return 'computer-lab';
    case 'electronics':
      return 'workshop';
    case 'nursing':
      return 'practical-lab';
    default:
      return 'classroom';
  }
}

function coursePriority(course: Course) {
  let score = 0;
  score += course.students * 0.5;
  score += course.practicalHours * 3;
  score += course.theoreticalHours;
  if (course.type === 'nursing') score += 12;
  if (course.type === 'programming') score += 6;
  if (course.type === 'electronics') score += 4;
  return score;
}

function findBestSlot(
  course: Course,
  schedule: ScheduleState,
  sessionType: 'theoretical' | 'practical',
  teachers: Teacher[],
  classrooms: Classroom[],
  shuffle: boolean
) {
  const teacher = teachers.find((t) => t.id === course.teacherId);
  if (!teacher) return null;
  const requiredType = getRequiredRoomType(course.type, sessionType);
  const compatibleRooms = classrooms
    .filter((room) => room.type === requiredType && room.capacity >= course.students)
    .sort((a, b) => a.capacity - b.capacity);
  if (compatibleRooms.length === 0) return null;

  const candidates: Array<{ day: number; slot: number; roomId: string; score: number }> = [];

  for (let day = 0; day < 5; day += 1) {
    for (let slot = 0; slot < 5; slot += 1) {
      const key = `${day}-${slot}`;
      const sessions = schedule[key] || [];
      if (!teacher.availability[day] || !teacher.availability[day].includes(slot)) continue;
      if (sessions.some((item) => item.teacherId === teacher.id)) continue;
      const freeRoom = compatibleRooms.find((room) => !sessions.some((item) => item.roomId === room.id));
      if (!freeRoom) continue;
      const existingSameCourse = Object.entries(schedule)
        .filter(([k]) => k.startsWith(`${day}-`))
        .flatMap(([, v]) => v)
        .filter((item) => item.courseId === course.id).length;
      let score = 0;
      score -= existingSameCourse * 15;
      if (slot <= 1) score += 3;
      score -= freeRoom.capacity * 0.02;
      candidates.push({ day, slot, roomId: freeRoom.id, score });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return shuffle ? candidates[Math.floor(Math.random() * Math.min(4, candidates.length))] : candidates[0];
}

export function detectConflicts(schedule: ScheduleState, courses: Course[], teachers: Teacher[], classrooms: Classroom[]): Conflict[] {
  const conflicts: Conflict[] = [];
  Object.entries(schedule).forEach(([key, sessions]) => {
    const [dayIndex, slotIndex] = key.split('-').map(Number);
    const day = dayIndex;
    const slotLabel = `${day}-${slotIndex}`;

    const teacherMap: Record<string, ScheduleState[string]> = {} as Record<string, ScheduleState[string]>;
    sessions.forEach((session) => {
      teacherMap[session.teacherId] = teacherMap[session.teacherId] || [];
      teacherMap[session.teacherId].push(session);
    });
    Object.entries(teacherMap).forEach(([teacherId, list]) => {
      if (list.length > 1) {
        const teacher = teachers.find((t) => t.id === teacherId);
        conflicts.push({
          severity: 'error',
          course: teacher ? teacher.name : 'Docente',
          sessionType: 'Doble asignacion',
          message: `El docente "${teacher?.name ?? 'desconocido'}" tiene mas de una sesion en el mismo bloque.`
        });
      }
    });
    const roomMap: Record<string, ScheduleState[string]> = {} as Record<string, ScheduleState[string]>;
    sessions.forEach((session) => {
      roomMap[session.roomId] = roomMap[session.roomId] || [];
      roomMap[session.roomId].push(session);
    });
    Object.entries(roomMap).forEach(([roomId, list]) => {
      if (list.length > 1) {
        const room = classrooms.find((r) => r.id === roomId);
        conflicts.push({
          severity: 'error',
          course: room ? room.name : 'Aula',
          sessionType: 'Doble asignacion',
          message: `El aula "${room?.name ?? 'desconocida'}" tiene mas de una sesion al mismo tiempo.`
        });
      }
    });
  });

  Object.values(schedule).flat().forEach((session) => {
    const course = courses.find((c) => c.id === session.courseId);
    const room = classrooms.find((r) => r.id === session.roomId);
    if (course && room && course.students > room.capacity) {
      conflicts.push({
        severity: 'warning',
        course: course.name,
        message: `"${course.name}" tiene ${course.students} alumnos pero el aula "${room.name}" solo soporta ${room.capacity}.`
      });
    }
  });

  return conflicts;
}

export function generateSchedule(
  courses: Course[],
  teachers: Teacher[],
  classrooms: Classroom[],
  shuffle = false
): { schedule: ScheduleState; conflicts: Conflict[] } {
  const schedule: ScheduleState = {};
  for (let day = 0; day < 5; day += 1) {
    for (let slot = 0; slot < 5; slot += 1) {
      schedule[`${day}-${slot}`] = [];
    }
  }

  const conflicts: Conflict[] = [];
  const sortedCourses = [...courses].sort((a, b) => coursePriority(b) - coursePriority(a));

  sortedCourses.forEach((course) => {
    for (let i = 0; i < course.theoreticalHours; i += 1) {
      const best = findBestSlot(course, schedule, 'theoretical', teachers, classrooms, shuffle);
      if (best) {
        schedule[`${best.day}-${best.slot}`].push({ courseId: course.id, teacherId: course.teacherId, roomId: best.roomId, sessionType: 'theoretical' });
      } else {
        conflicts.push({
          severity: 'error',
          course: course.name,
          sessionType: 'Teorica',
          message: `Sin espacio valido para "${course.name}" en sesion teorica.`
        });
      }
    }
    for (let i = 0; i < course.practicalHours; i += 1) {
      const best = findBestSlot(course, schedule, 'practical', teachers, classrooms, shuffle);
      if (best) {
        schedule[`${best.day}-${best.slot}`].push({ courseId: course.id, teacherId: course.teacherId, roomId: best.roomId, sessionType: 'practical' });
      } else {
        conflicts.push({
          severity: 'error',
          course: course.name,
          sessionType: 'Practica',
          message: `Sin espacio valido para "${course.name}" en sesion practica.`
        });
      }
    }
  });

  const fullConflicts = detectConflicts(schedule, courses, teachers, classrooms);
  return { schedule, conflicts: [...conflicts, ...fullConflicts] };
}
