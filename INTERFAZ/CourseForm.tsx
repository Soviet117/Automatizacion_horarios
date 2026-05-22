'use client';

import { FormEvent, useState } from 'react';
import { Course, Teacher } from './types';
import { COURSE_TYPES } from './data';

interface CourseFormProps {
  course?: Course | null;
  teachers: Teacher[];
  onSubmit: (course: Omit<Course, 'id'>) => void;
}

export default function CourseForm({ course, teachers, onSubmit }: CourseFormProps) {
  const [name, setName] = useState(course?.name ?? '');
  const [type, setType] = useState<Course['type']>(course?.type ?? 'theoretical');
  const [program, setProgram] = useState(course?.program ?? '');
  const [semester, setSemester] = useState(course?.semester ?? 1);
  const [theoreticalHours, setTheoreticalHours] = useState(course?.theoreticalHours ?? 0);
  const [practicalHours, setPracticalHours] = useState(course?.practicalHours ?? 0);
  const [students, setStudents] = useState(course?.students ?? 1);
  const [teacherId, setTeacherId] = useState(course?.teacherId ?? '');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ name, type, program, semester, theoreticalHours, practicalHours, students, teacherId });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">Nombre de la Materia</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-pri focus:ring-pri/30"
          placeholder="Ej. Estructura de Datos"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-stone-600">
          Tipo
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Course['type'])}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-pri focus:ring-pri/30"
          >
            {COURSE_TYPES.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-stone-600">
          Programa
          <input
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-pri focus:ring-pri/30"
            placeholder="Ej. Ciencias de la Computacion"
            required
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="block text-xs font-medium text-stone-600">
          Semestre
          <input
            type="number"
            min={1}
            max={12}
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-pri focus:ring-pri/30"
            required
          />
        </label>
        <label className="block text-xs font-medium text-stone-600">
          Horas Teoría
          <input
            type="number"
            min={0}
            max={6}
            value={theoreticalHours}
            onChange={(e) => setTheoreticalHours(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-pri focus:ring-pri/30"
            required
          />
        </label>
        <label className="block text-xs font-medium text-stone-600">
          Horas Práctica
          <input
            type="number"
            min={0}
            max={6}
            value={practicalHours}
            onChange={(e) => setPracticalHours(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-pri focus:ring-pri/30"
            required
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-stone-600">
          Alumnos
          <input
            type="number"
            min={1}
            max={200}
            value={students}
            onChange={(e) => setStudents(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-pri focus:ring-pri/30"
            required
          />
        </label>
        <label className="block text-xs font-medium text-stone-600">
          Docente
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-pri focus:ring-pri/30"
            required
          >
            <option value="">— Seleccionar Docente —</option>
            {teachers.map((teacher) => (
              <option value={teacher.id} key={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
