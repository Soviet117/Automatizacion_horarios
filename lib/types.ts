'use client';

export type DemoUser = {
  username: string;
  password: string;
  name: string;
  role: string;
};

export type CourseTypeValue = 'theoretical' | 'programming' | 'electronics' | 'nursing';
export type RoomTypeValue = 'classroom' | 'computer-lab' | 'workshop' | 'practical-lab';

export type AppTab = 'dashboard' | 'courses' | 'cohorts' | 'teachers' | 'classrooms' | 'schedule';

export interface Course {
  id: string;
  name: string;
  type: CourseTypeValue;
  theoreticalHours: number;
  practicalHours: number;
  program: string;
  semester: number;
}

export interface Cohort {
  id: string;
  name: string;
  program: string;
  semester: number;
  students: number;
  requiredCourses: Array<{
    courseId: string;
    hours: number;
  }>;
}

export interface Teacher {
  id: string;
  name: string;
  maxHours: number;
  competencies: string[]; // Array of Course IDs
  availability: Record<number, number[]>;
  dni?: string;
  nombre?: string;
  apellido?: string;
  especialidad?: string;
  email?: string;
}

export interface Classroom {
  id: string;
  name: string;
  type: RoomTypeValue;
  capacity: number;
}

export interface ScheduleSession {
  courseId: string;
  teacherId: string;
  roomId: string;
  cohortId?: string;
  sessionType: 'theoretical' | 'practical';
}

export interface Conflict {
  severity: 'info' | 'warning' | 'error';
  course: string;
  message: string;
  sessionType?: string;
}

export interface SessionUser {
  username: string;
  name: string;
  role: string;
}

export interface ScheduleState {
  [key: string]: ScheduleSession[];
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ModalState {
  open: boolean;
  type: 'course' | 'cohort' | 'teacher' | 'classroom' | null;
  id: string | null;
}
