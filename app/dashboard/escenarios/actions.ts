'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getEscenarios() {
  const escenarios = await prisma.escenario.findMany({
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
  }));
}

export async function createEscenario(data: { name: string, type: string, description: string, userId?: string }) {
  const escenario = await prisma.escenario.create({
    data: {
      nom_escenario: data.name,
      descripcion: data.description,
      estado: data.type,
      creado_por: data.userId ?? 'Admin',
      cobertura: 0,
      conflictos: 0,
    }
  });
  revalidatePath('/dashboard/escenarios');
  return escenario;
}

export async function deleteEscenario(id: string) {
  const e = await prisma.escenario.findUnique({ where: { id_escenario: id } });
  if (e?.estado === 'published') {
    throw new Error('No puedes eliminar un escenario publicado. Publica otro primero.');
  }

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
  
  // Cambiar estado a 'simulation'
  await prisma.escenario.update({
    where: { id_escenario },
    data: { estado: 'simulation' }
  });

  // Pasamos null como userId — las sesiones no se vinculan a un usuario específico
  // sino al escenario. Esto evita la violación de FK en horario_sesion_usuario_fk.
  const result = await SchedulerService.optimizeSchedule(null as any, id_escenario);

  // Ya que se guardaron las sesiones, podemos calcular cobertura y conflictos.
  // Por ahora, asumiremos 100% de cobertura y 0 conflictos si la llamada fue exitosa (el solver falla si es INFEASIBLE).
  // Una mejor métrica calcularía (horas asignadas / horas requeridas), pero esto es un gran primer paso.
  await prisma.escenario.update({
    where: { id_escenario },
    data: {
      cobertura: 100, // Simplificación por ahora
      conflictos: 0,
    }
  });

  revalidatePath('/dashboard/escenarios');
  return result;
}
