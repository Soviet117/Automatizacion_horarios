'use client';

import { Course, Teacher, Classroom, CourseTypeValue, RoomTypeValue } from './types';
import { COURSE_TYPES, ROOM_TYPES } from './data';

export function encodeHtml(value: string) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

export function getTeacherName(teachers: Teacher[], id: string) {
  const teacher = teachers.find((item) => item.id === id);
  return teacher ? teacher.name : 'Sin asignar';
}

export function getRoomName(classrooms: Classroom[], id: string) {
  const room = classrooms.find((item) => item.id === id);
  return room ? room.name : '—';
}

export function getCourseName(courses: Course[], id: string) {
  const course = courses.find((item) => item.id === id);
  return course ? course.name : '—';
}

export function typeBadge(type: CourseTypeValue) {
  const category = COURSE_TYPES.find((item) => item.value === type);
  if (!category) return null;
  return (
    <span
      style={{
        backgroundColor: category.bg,
        color: category.color,
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '0.725rem',
        fontWeight: 600,
      }}
    >
      {category.label}
    </span>
  );
}

export function roomBadge(type: RoomTypeValue) {
  const room = ROOM_TYPES.find((item) => item.value === type);
  if (!room) return null;
  const colorClasses: Record<RoomTypeValue, { bg: string; text: string }> = {
    'classroom': { bg: '#ECFDF5', text: '#166534' },
    'computer-lab': { bg: '#DBEAFE', text: '#1D4ED8' },
    'workshop': { bg: '#FEF3C7', text: '#B45309' },
    'practical-lab': { bg: '#FFE4E6', text: '#BE123C' },
  };
  const colors = colorClasses[type];
  return (
    <span
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '0.725rem',
        fontWeight: 600,
      }}
    >
      {room.label}
    </span>
  );
}

export function sumTeacherLoad(schedule: Record<string, any[]>, teacherId: string) {
  return Object.values(schedule).flat().filter((session) => session.teacherId === teacherId).length;
}

export function sumRoomUsage(schedule: Record<string, any[]>, roomId: string) {
  return Object.values(schedule).flat().filter((session) => session.roomId === roomId).length;
}
