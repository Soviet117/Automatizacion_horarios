import { PrismaClient } from '@prisma/client';

let defaultsEnsured = false;

export async function ensureDefaults(prisma: PrismaClient) {
  if (defaultsEnsured) return;

  await Promise.all([
    ensurePeriodoActivo(prisma),
    ensureTipoAula(prisma),
    ensureDiasYBloques(prisma),
  ]);

  defaultsEnsured = true;
}

async function ensurePeriodoActivo(prisma: PrismaClient) {
  const exists = await prisma.periodo_academico.findFirst({ where: { activo: true } });
  if (!exists) {
    const count = await prisma.periodo_academico.count();
    if (count === 0) {
      await prisma.periodo_academico.create({
        data: { id_periodo: '2026-1', nom_periodo: 'Semestre 2026-I', activo: true },
      });
    } else {
      await prisma.periodo_academico.updateMany({ where: { activo: false }, data: { activo: true } });
    }
  }
}

async function ensureTipoAula(prisma: PrismaClient) {
  const count = await prisma.tipo_aula.count();
  if (count === 0) {
    await prisma.tipo_aula.createMany({
      data: [
        { id_tipo_aula: 'classroom', nom_tipo_aula: 'Aula Teórica' },
        { id_tipo_aula: 'computer-lab', nom_tipo_aula: 'Laboratorio de Cómputo' },
        { id_tipo_aula: 'workshop', nom_tipo_aula: 'Taller Especializado' },
      ],
    });
  }
}

async function ensureDiasYBloques(prisma: PrismaClient) {
  const [diasCount, bloquesCount] = await Promise.all([
    prisma.dia_semana.count(),
    prisma.bloque_horario.count(),
  ]);

  if (diasCount === 0) {
    await prisma.dia_semana.createMany({
      data: [
        { id_dia: 0, nom_dia: 'Lunes' },
        { id_dia: 1, nom_dia: 'Martes' },
        { id_dia: 2, nom_dia: 'Miércoles' },
        { id_dia: 3, nom_dia: 'Jueves' },
        { id_dia: 4, nom_dia: 'Viernes' },
      ],
    });
  }

  if (bloquesCount === 0) {
    await prisma.bloque_horario.createMany({
      data: [
        { id_bloque: 0, horario_inicio: '07:00', horario_fin: '08:20' },
        { id_bloque: 1, horario_inicio: '08:30', horario_fin: '10:00' },
        { id_bloque: 2, horario_inicio: '10:15', horario_fin: '11:45' },
        { id_bloque: 3, horario_inicio: '12:00', horario_fin: '13:30' },
        { id_bloque: 4, horario_inicio: '15:45', horario_fin: '17:15' },
        { id_bloque: 5, horario_inicio: '17:30', horario_fin: '19:00' },
        { id_bloque: 6, horario_inicio: '19:10', horario_fin: '20:40' },
        { id_bloque: 7, horario_inicio: '20:50', horario_fin: '22:20' },
      ],
    });
  }
}
