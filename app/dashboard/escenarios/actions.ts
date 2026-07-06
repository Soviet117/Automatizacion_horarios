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
