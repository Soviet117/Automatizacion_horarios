'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Teacher, Classroom, RoomTypeValue } from '@/lib/types';

export async function getDocentes(): Promise<Teacher[]> {
  const docentes = await prisma.docente.findMany({
    include: {
      usuario: true,
      disponibilidad_docente: true,
    }
  });

  return docentes.map((d: any) => ({
    id: d.id_docente,
    name: `${d.nom_docente} ${d.ape_docente}`.trim(),
    dni: d.dni_docente || '',
    nombre: d.nom_docente || '',
    apellido: d.ape_docente || '',
    especialidad: d.nom_especialidad || '',
    email: d.usuario?.email || '',
    maxHours: 40,
    competencies: [], 
    availability: d.disponibilidad_docente.reduce((acc: any, curr: any) => {
        if (!acc[curr.id_dia]) acc[curr.id_dia] = [];
        acc[curr.id_dia].push(curr.id_bloque);
        return acc;
    }, {} as Record<number, number[]>)
  }));
}

export async function createDocente(data: { dni: string, nombre: string, apellido: string, especialidad: string, email: string, competencies: string[], availability: Record<number, number[]> }) {
  const existing = await prisma.docente.findFirst({ where: { dni_docente: data.dni } });
  if (existing) throw new Error('Ya existe un docente con este DNI');

  const id_docente = crypto.randomUUID();

  let id_usuario = null;
  if (data.email) {
     const existingUser = await prisma.usuario.findUnique({ where: { email: data.email } });
     if (existingUser) {
         id_usuario = existingUser.id_usuario;
     } else {
         const user = await prisma.usuario.create({
            data: {
              email: data.email,
              nombre: `${data.nombre} ${data.apellido}`,
              password: 'password_temporal', 
            }
         });
         id_usuario = user.id_usuario;
     }
  }

  // Seed lookups (Días y Bloques) si no existen
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  for (let i = 0; i < dias.length; i++) {
    await prisma.dia_semana.upsert({
      where: { id_dia: i },
      update: {},
      create: { id_dia: i, nom_dia: dias[i] }
    });
  }

  const horarios = [
    { i: 0, start: '07:00', end: '09:00' },
    { i: 1, start: '09:00', end: '11:00' },
    { i: 2, start: '11:00', end: '13:00' },
    { i: 3, start: '14:00', end: '16:00' },
    { i: 4, start: '16:00', end: '18:00' }
  ];
  for (const h of horarios) {
    await prisma.bloque_horario.upsert({
      where: { id_bloque: h.i },
      update: {},
      create: { id_bloque: h.i, horario_inicio: h.start, horario_fin: h.end }
    });
  }

  await prisma.docente.create({
    data: {
      id_docente,
      nom_docente: data.nombre,
      ape_docente: data.apellido,
      dni_docente: data.dni,
      nom_especialidad: data.especialidad,
      id_usuario,
      disponibilidad_docente: {
        create: Object.entries(data.availability).flatMap(([dia, bloques]) => 
          bloques.map((bloque: number) => ({
             id_disponibilidad: crypto.randomUUID(),
             id_dia: Number(dia),
             id_bloque: bloque
          }))
        )
      }
    }
  });

  revalidatePath('/dashboard/recursos');
}

export async function updateDocente(id_docente: string, data: { dni: string, nombre: string, apellido: string, especialidad: string, email: string, competencies: string[], availability: Record<number, number[]> }) {
  const existing = await prisma.docente.findFirst({ where: { dni_docente: data.dni, NOT: { id_docente } } });
  if (existing) throw new Error('Ya existe otro docente con este DNI');

  const doc = await prisma.docente.findUnique({ where: { id_docente }, include: { usuario: true } });
  if (!doc) throw new Error('Docente no encontrado');

  let id_usuario = doc.id_usuario;
  if (data.email) {
     if (id_usuario) {
        await prisma.usuario.update({ where: { id_usuario }, data: { email: data.email, nombre: `${data.nombre} ${data.apellido}` } });
     } else {
        const existingUser = await prisma.usuario.findUnique({ where: { email: data.email } });
        if (existingUser) {
           id_usuario = existingUser.id_usuario;
        } else {
           const user = await prisma.usuario.create({ data: { email: data.email, nombre: `${data.nombre} ${data.apellido}`, password: 'password_temporal' } });
           id_usuario = user.id_usuario;
        }
     }
  }

  await prisma.disponibilidad_docente.deleteMany({ where: { id_docente } });

  await prisma.docente.update({
    where: { id_docente },
    data: {
      nom_docente: data.nombre,
      ape_docente: data.apellido,
      dni_docente: data.dni,
      nom_especialidad: data.especialidad,
      id_usuario,
      disponibilidad_docente: {
        create: Object.entries(data.availability).flatMap(([dia, bloques]) => 
          bloques.map((bloque: number) => ({
             id_disponibilidad: crypto.randomUUID(),
             id_dia: Number(dia),
             id_bloque: bloque
          }))
        )
      }
    }
  });

  revalidatePath('/dashboard/recursos');
}

export async function deleteDocente(id_docente: string) {
  const doc = await prisma.docente.findUnique({ where: { id_docente } });
  if (!doc) return;

  await prisma.docente.delete({ where: { id_docente } });

  revalidatePath('/dashboard/recursos');
}

export async function getAulas(): Promise<Classroom[]> {
  const aulas = await prisma.aula.findMany();
  return aulas.map((a: any) => ({
    id: a.id_aula,
    name: a.nom_aula,
    type: (a.id_tipo_aula as RoomTypeValue) || 'classroom',
    capacity: a.capacidad,
  }));
}

export async function createAula(data: { name: string, type: string, capacity: number }) {
  const existing = await prisma.aula.findFirst({ where: { nom_aula: data.name } });
  if (existing) throw new Error('Ya existe un aula con este nombre');

  await prisma.tipo_aula.upsert({
    where: { id_tipo_aula: data.type },
    update: {},
    create: { id_tipo_aula: data.type, nom_tipo_aula: data.type }
  });

  await prisma.aula.create({
    data: {
      id_aula: crypto.randomUUID(),
      nom_aula: data.name,
      id_tipo_aula: data.type,
      capacidad: data.capacity
    }
  });

  revalidatePath('/dashboard/recursos');
}

export async function updateAula(id_aula: string, data: { name: string, type: string, capacity: number }) {
  const existing = await prisma.aula.findFirst({ where: { nom_aula: data.name, NOT: { id_aula } } });
  if (existing) throw new Error('Ya existe otra aula con este nombre');

  await prisma.tipo_aula.upsert({
    where: { id_tipo_aula: data.type },
    update: {},
    create: { id_tipo_aula: data.type, nom_tipo_aula: data.type }
  });

  await prisma.aula.update({
    where: { id_aula },
    data: {
      nom_aula: data.name,
      id_tipo_aula: data.type,
      capacidad: data.capacity
    }
  });

  revalidatePath('/dashboard/recursos');
}

export async function deleteAula(id_aula: string) {
  await prisma.aula.delete({ where: { id_aula } });
  revalidatePath('/dashboard/recursos');
}
