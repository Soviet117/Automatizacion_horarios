'use client';

export type DemoUser = {
  username: string;
  password: string;
  name: string;
  role: string;
};

export type CourseTypeValue = 'theoretical' | 'programming' | 'electronics' | 'nursing';
export type RoomTypeValue = 'classroom' | 'computer-lab' | 'workshop' | 'practical-lab';

export type AppTab = 'dashboard' | 'courses' | 'teachers' | 'classrooms' | 'schedule';

export interface Course {
  id: string;
  name: string;
  type: CourseTypeValue;
  theoreticalHours: number;
  practicalHours: number;
  students: number;
  program: string;
  semester: number;
  teacherId: string;
}

export interface Teacher {
  id: string;
  name: string;
  availability: Record<number, number[]>;
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
  type: 'course' | 'teacher' | 'classroom' | null;
  id: string | null;
}
