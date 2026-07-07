'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getEscenarios() {
  const escenarios = await prisma.escenario.findMany({
    include: {
      ciclo: true,
      plan: true
    },
    orderBy: { creado_el: 'desc' }
  });
  return escenarios.map(e => ({
    id: e.id_escenario,
    name: e.nom_escenario,
    description: e.descripcion ?? '',
    status: e.estado as 'published' | 'draft' | 'simulation',
    createdAt: e.creado_el.toISOString().split('T')[0],
    createdBy: e.creado_por ?? 'Usuario',
    conflicts: e.conflictos,
    coverage: e.cobertura,
    ciclo: e.ciclo ? { id: e.ciclo.id_ciclo, name: e.ciclo.nom_ciclo } : null,
    plan: e.plan ? { id: e.plan.id_plan, name: e.plan.nom_plan } : null,
  }));
}

export async function createEscenario(data: {
  name: string,
  type: string,
  description: string,
  userId?: string,
  id_ciclo: number,
  id_plan: string
}) {
  const escenario = await prisma.escenario.create({
    data: {
      nom_escenario: data.name,
      descripcion: data.description,
      estado: data.type,
      creado_por: data.userId ?? 'Admin',
      cobertura: 0,
      conflictos: 0,
      id_ciclo: data.id_ciclo,
      id_plan: data.id_plan,
    }
  });
  revalidatePath('/dashboard/escenarios');
  return escenario;
}

export async function deleteEscenario(id: string) {
  // Las sesiones asociadas se eliminan en cascada gracias al onDelete: Cascade en schema.prisma
  await prisma.escenario.delete({ where: { id_escenario: id } });
  revalidatePath('/dashboard/escenarios');
}

export async function publishEscenario(id: string) {
  // Primero, cambiar cualquier 'published' a 'draft' o 'archived'
  await prisma.escenario.updateMany({
    where: { estado: 'published' },
    data: { estado: 'draft' }
  });

  // Marcar el seleccionado como 'published'
  await prisma.escenario.update({
    where: { id_escenario: id },
    data: { estado: 'published' }
  });

  revalidatePath('/dashboard/escenarios');
}

export async function duplicateEscenario(id: string) {
  const original = await prisma.escenario.findUnique({
    where: { id_escenario: id },
    include: { horario_sesion: true }
  });

  if (!original) throw new Error('Escenario no encontrado');

  // Crear el nuevo escenario
  const nuevo = await prisma.escenario.create({
    data: {
      nom_escenario: original.nom_escenario + ' (Copia)',
      descripcion: original.descripcion,
      estado: 'draft',
      cobertura: original.cobertura,
      conflictos: original.conflictos,
      creado_por: original.creado_por,
      id_ciclo: original.id_ciclo,
      id_plan: original.id_plan,
    }
  });

  // Copiar las sesiones
  if (original.horario_sesion.length > 0) {
    const sesiones = original.horario_sesion.map(s => ({
      id_horario: crypto.randomUUID(),
      id_asignacion: s.id_asignacion,
      id_docente: s.id_docente,
      id_periodo: s.id_periodo,
      id_aula: s.id_aula,
      id_dia: s.id_dia,
      id_bloque: s.id_bloque,
      tipo_sesion: s.tipo_sesion,
      id_usuario: s.id_usuario,
      id_escenario: nuevo.id_escenario
    }));

    await prisma.horario_sesion.createMany({
      data: sesiones
    });
  }

  revalidatePath('/dashboard/escenarios');
  return nuevo;
}

export async function runOptimizationForEscenario(id_escenario: string) {
  const { SchedulerService } = await import('@/lib/schedulerService');
  
  await prisma.escenario.update({
    where: { id_escenario },
    data: { estado: 'simulation' }
  });

  const result = await SchedulerService.optimizeSchedule(null as any, id_escenario);

  revalidatePath('/dashboard/escenarios');
  return result;
}

export async function assignSessionToSlot(
  id_escenario: string,
  id_asignacion: string,
  id_docente: string,
  id_dia: number,
  id_bloque: number,
  tipo_sesion?: string
) {
  const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
  if (!periodo) throw new Error('No hay periodo académico activo');

  // 1. Check teacher availability
  const disp = await prisma.disponibilidad_docente.findFirst({
    where: { id_docente, id_dia, id_bloque }
  });
  if (!disp) throw new Error('El docente no tiene disponibilidad en ese horario.');

  // 2. Check teacher collision
  const teacherCollision = await prisma.horario_sesion.findFirst({
    where: {
      id_escenario,
      id_docente,
      id_dia,
      id_bloque,
      NOT: { id_asignacion }
    }
  });
  if (teacherCollision) throw new Error('El docente ya tiene una sesión en ese horario.');

  // 3. Find available room (capacity >= students, not occupied)
  const asignacion = await prisma.asignacion.findUnique({
    where: { id_asignacion },
    include: { curso: true }
  });
  if (!asignacion) throw new Error('Asignación no encontrada.');

  const estudiantes = asignacion.curso.alumnos || 30;

  const occupiedRooms = await prisma.horario_sesion.findMany({
    where: { id_escenario, id_dia, id_bloque },
    select: { id_aula: true }
  });
  const occupiedIds = new Set(occupiedRooms.map(r => r.id_aula));

  const availableRoom = await prisma.aula.findFirst({
    where: {
      capacidad: { gte: estudiantes },
      NOT: { id_aula: { in: [...occupiedIds] } }
    },
    orderBy: { capacidad: 'asc' }
  });
  if (!availableRoom) throw new Error('No hay aulas disponibles con capacidad suficiente en ese horario.');

  // 4. Create session
  const session = await prisma.horario_sesion.create({
    data: {
      id_horario: crypto.randomUUID(),
      id_asignacion,
      id_docente,
      id_aula: availableRoom.id_aula,
      id_dia,
      id_bloque,
      id_periodo: periodo.id_periodo,
      tipo_sesion: tipo_sesion ?? asignacion.curso.tipo_curso ?? 'Teórica',
      id_usuario: null,
      id_escenario
    }
  });

  // 5. Update coverage
  await updateEscenarioCoverage(id_escenario, periodo.id_periodo);

  revalidatePath('/dashboard/escenarios');
  return { success: true, session };
}

export async function removeSession(id_horario: string) {
  const session = await prisma.horario_sesion.findUnique({
    where: { id_horario },
    select: { id_escenario: true }
  });
  if (!session) throw new Error('Sesión no encontrada.');

  await prisma.horario_sesion.delete({ where: { id_horario } });

  // Update coverage
  const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
  if (periodo) {
    await updateEscenarioCoverage(session.id_escenario, periodo.id_periodo);
  }

  revalidatePath('/dashboard/escenarios');
  return { success: true };
}

export async function moveSessionToSlot(
  id_horario: string,
  id_dia: number,
  id_bloque: number
) {
  const session = await prisma.horario_sesion.findUnique({
    where: { id_horario },
    include: { asignacion: { include: { curso: true } } }
  });
  if (!session) throw new Error('Sesión no encontrada.');

  const escenario = await prisma.escenario.findUnique({
    where: { id_escenario: session.id_escenario }
  });
  if (!escenario || escenario.estado !== 'draft' && escenario.estado !== 'simulation') {
    throw new Error('Solo puedes mover sesiones en escenarios Borrador o Simulación.');
  }

  // Check teacher availability
  const disp = await prisma.disponibilidad_docente.findFirst({
    where: { id_docente: session.id_docente, id_dia, id_bloque }
  });
  if (!disp) throw new Error('El docente no tiene disponibilidad en ese horario.');

  // Check teacher collision (excluding self)
  const teacherCollision = await prisma.horario_sesion.findFirst({
    where: {
      id_escenario: session.id_escenario,
      id_docente: session.id_docente,
      id_dia,
      id_bloque,
      NOT: { id_horario }
    }
  });
  if (teacherCollision) throw new Error('El docente ya tiene una sesión en ese horario.');

  // Find available room
  const estudiantes = session.asignacion.curso.alumnos || 30;
  const occupiedRooms = await prisma.horario_sesion.findMany({
    where: {
      id_escenario: session.id_escenario,
      id_dia,
      id_bloque,
      NOT: { id_horario }
    },
    select: { id_aula: true }
  });
  const occupiedIds = new Set(occupiedRooms.map(r => r.id_aula));

  const availableRoom = await prisma.aula.findFirst({
    where: {
      capacidad: { gte: estudiantes },
      NOT: { id_aula: { in: [...occupiedIds] } }
    },
    orderBy: { capacidad: 'asc' }
  });
  if (!availableRoom) throw new Error('No hay aulas disponibles con capacidad suficiente en ese horario.');

  // Update session
  await prisma.horario_sesion.update({
    where: { id_horario },
    data: {
      id_dia,
      id_bloque,
      id_aula: availableRoom.id_aula
    }
  });

  revalidatePath('/dashboard/escenarios');
  return { success: true };
}

async function updateEscenarioCoverage(id_escenario: string, id_periodo: string) {
  const [totalAsignaciones, sesionesAsignadas] = await Promise.all([
    prisma.asignacion.count({
      where: {
        id_periodo,
        curso: {
          id_ciclo: (await prisma.escenario.findUnique({ where: { id_escenario }, select: { id_ciclo: true } }))?.id_ciclo ?? undefined
        }
      }
    }),
    prisma.horario_sesion.count({
      where: { id_escenario }
    })
  ]);

  // Simple coverage: assigned / (total * avg_hours_per_course)
  // We use a heuristic: each course needs ~4 sessions on average
  const estimatedTotal = totalAsignaciones * 4;
  const coverage = estimatedTotal > 0 ? Math.min(Math.round((sesionesAsignadas / estimatedTotal) * 100), 100) : 0;
  const conflicts = Math.max(0, 100 - coverage);

  await prisma.escenario.update({
    where: { id_escenario },
    data: {
      cobertura: coverage,
      conflictos: coverage < 100 ? conflicts : 0
    }
  });
}
