import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [facultades, carreras, ciclos, tiposAula, periodos, planes, tipoSesiones, dias, bloques] = await Promise.all([
      prisma.facultad.findMany({
        orderBy: { nom_facultad: 'asc' },
      }),
      prisma.carrera.findMany({
        orderBy: { nom_carrera: 'asc' },
      }),
      prisma.ciclo.findMany({
        orderBy: { id_ciclo: 'asc' },
      }),
      prisma.tipo_aula.findMany({
        orderBy: { nom_tipo_aula: 'asc' },
      }),
      prisma.periodo_academico.findMany({
        orderBy: { id_periodo: 'asc' },
      }),
      prisma.plan_estudio.findMany({
        orderBy: { nom_plan: 'asc' },
      }),
      prisma.tipo_sesion.findMany({
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
