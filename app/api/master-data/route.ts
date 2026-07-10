import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureDefaults } from '@/lib/ensureDefaults'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    await ensureDefaults(prisma, userId);

    const userFilter = userId ? { id_usuario: userId } : {};

    const [facultades, carreras, ciclos, tiposAula, periodos, planes, tipoSesiones, dias, bloques] = await Promise.all([
      prisma.facultad.findMany({
        where: userFilter,
        orderBy: { nom_facultad: 'asc' },
      }),
      prisma.carrera.findMany({
        where: userFilter,
        orderBy: { nom_carrera: 'asc' },
      }),
      prisma.ciclo.findMany({
        where: userFilter,
        orderBy: { id_ciclo: 'asc' },
      }),
      prisma.tipo_aula.findMany({
        where: userFilter,
        orderBy: { nom_tipo_aula: 'asc' },
      }),
      prisma.periodo_academico.findMany({
        where: userFilter,
        orderBy: { id_periodo: 'asc' },
      }),
      prisma.plan_estudio.findMany({
        where: userFilter,
        orderBy: { nom_plan: 'asc' },
      }),
      prisma.tipo_sesion.findMany({
        where: userFilter,
        orderBy: { nom_tipo_sesion: 'asc' },
      }),
      prisma.dia_semana.findMany({
        orderBy: { id_dia: 'asc' },
      }),
      prisma.bloque_horario.findMany({
        orderBy: { id_bloque: 'asc' },
      }),
    ])

    return NextResponse.json({
      facultades,
      carreras,
      ciclos,
      tiposAula,
      periodos,
      planes,
      tipoSesiones,
      dias,
      bloques,
    })
  } catch (error) {
    console.error('Error fetching master data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos maestros' },
      { status: 500 }
    )
  }
}
