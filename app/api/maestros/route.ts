import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDefaults } from '@/lib/ensureDefaults';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    await ensureDefaults(prisma, userId);

    const userFilter = userId ? { id_usuario: userId } : {};

    const [carreras, ciclos, tiposSesion, planesEstudio] = await Promise.all([
      prisma.carrera.findMany({ where: userFilter, select: { id_carrera: true, nom_carrera: true } }),
      prisma.ciclo.findMany({ where: userFilter, select: { id_ciclo: true, nom_ciclo: true }, orderBy: { id_ciclo: 'asc' } }),
      prisma.tipo_sesion.findMany({ where: userFilter, select: { id_tipo_sesion: true, nom_tipo_sesion: true } }),
      prisma.plan_estudio.findMany({ where: userFilter, select: { id_plan: true, nom_plan: true, id_carrera: true } }),
    ]);

    return NextResponse.json({
      carreras,
      ciclos,
      tiposSesion,
      planesEstudio
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master data' },
      { status: 500 }
    );
  }
}
