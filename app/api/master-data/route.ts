import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Verificar y pre-poblar facultad
    const facultadesCount = await prisma.facultad.count();
    if (facultadesCount === 0) {
      await prisma.facultad.create({
        data: { id_facultad: 'F01', nom_facultad: 'Facultad General' }
      });
    }

    // 2. Verificar y pre-poblar carreras
    const carrerasCount = await prisma.carrera.count();
    if (carrerasCount === 0) {
      await prisma.carrera.createMany({
        data: [
          { id_carrera: 'C01', nom_carrera: 'General', id_facultad: 'F01' },
          { id_carrera: 'C02', nom_carrera: 'Ciencias de la Computacion', id_facultad: 'F01' },
          { id_carrera: 'C03', nom_carrera: 'Ingenieria Electronica', id_facultad: 'F01' },
          { id_carrera: 'C04', nom_carrera: 'Enfermeria', id_facultad: 'F01' },
        ]
      });
    }

    // 3. Verificar y pre-poblar ciclos (1 al 10)
    const ciclosCount = await prisma.ciclo.count();
    if (ciclosCount === 0) {
      const dataCiclos = [];
      for (let i = 1; i <= 10; i++) {
        dataCiclos.push({ id_ciclo: i, nom_ciclo: `${i}` });
      }
      await prisma.ciclo.createMany({
        data: dataCiclos
      });
    }

    // 4. Verificar y pre-poblar tipos de aula
    const tiposAulaCount = await prisma.tipo_aula.count();
    if (tiposAulaCount === 0) {
      await prisma.tipo_aula.createMany({
        data: [
          { id_tipo_aula: 'T1', nom_tipo_aula: 'General' },
          { id_tipo_aula: 'classroom', nom_tipo_aula: 'Aula Estandar' },
          { id_tipo_aula: 'computer-lab', nom_tipo_aula: 'Laboratorio de Computacion' },
          { id_tipo_aula: 'workshop', nom_tipo_aula: 'Taller' },
          { id_tipo_aula: 'practical-lab', nom_tipo_aula: 'Laboratorio Practico' },
        ]
      });
    }

    // 5. Verificar y pre-poblar tipo_sesion
    const tipoSesionCount = await prisma.tipo_sesion.count();
    if (tipoSesionCount === 0) {
      await prisma.tipo_sesion.createMany({
        data: [
          { id_tipo_sesion: 'theoretical', nom_tipo_sesion: 'Teórica' },
          { id_tipo_sesion: 'programming', nom_tipo_sesion: 'Programación' },
          { id_tipo_sesion: 'electronics', nom_tipo_sesion: 'Electrónica' },
          { id_tipo_sesion: 'nursing', nom_tipo_sesion: 'Enfermería' },
        ]
      });
    }

    // 6. Verificar y pre-poblar dia_semana
    const diaSemanaCount = await prisma.dia_semana.count();
    if (diaSemanaCount === 0) {
      await prisma.dia_semana.createMany({
        data: [
          { id_dia: 0, nom_dia: 'Lunes' },
          { id_dia: 1, nom_dia: 'Martes' },
          { id_dia: 2, nom_dia: 'Miercoles' },
          { id_dia: 3, nom_dia: 'Jueves' },
          { id_dia: 4, nom_dia: 'Viernes' },
        ]
      });
    }

    // 7. Verificar y pre-poblar bloque_horario
    const bloqueHorarioCount = await prisma.bloque_horario.count();
    if (bloqueHorarioCount === 0) {
      await prisma.bloque_horario.createMany({
        data: [
          { id_bloque: 0, horario_inicio: '07:00', horario_fin: '09:00' },
          { id_bloque: 1, horario_inicio: '09:00', horario_fin: '11:00' },
          { id_bloque: 2, horario_inicio: '11:00', horario_fin: '13:00' },
          { id_bloque: 3, horario_inicio: '14:00', horario_fin: '16:00' },
          { id_bloque: 4, horario_inicio: '16:00', horario_fin: '18:00' },
        ]
      });
    }

    // 8. Verificar y pre-poblar periodo_academico
    const periodoAcademicoCount = await prisma.periodo_academico.count();
    if (periodoAcademicoCount === 0) {
      await prisma.periodo_academico.create({
        data: { id_periodo: 'Actual', nom_periodo: 'Periodo Actual', activo: true }
      });
    }

    // 9. Verificar y pre-poblar plan_estudio
    const planEstudioCount = await prisma.plan_estudio.count();
    if (planEstudioCount === 0) {
      await prisma.plan_estudio.create({
        data: { id_plan: 'PLAN_GEN', nom_plan: 'Plan General', id_carrera: 'C01' }
      });
    }

    const [facultades, carreras, ciclos, tiposAula, periodos, planes, tipoSesiones] = await Promise.all([
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
    ])

    return NextResponse.json({
      facultades,
      carreras,
      ciclos,
      tiposAula,
      periodos,
      planes,
      tipoSesiones,
    })
  } catch (error) {
    console.error('Error fetching master data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos maestros' },
      { status: 500 }
    )
  }
}
