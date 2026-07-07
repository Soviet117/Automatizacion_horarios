import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TIPO_AULA_MAP_BY_NAME } from '@/lib/tipoAulaMap';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;

    const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
    if (!periodo) {
      return NextResponse.json({ error: 'No hay periodo académico activo' }, { status: 400 });
    }

    const escenario = await prisma.escenario.findUnique({
      where: { id_escenario: id },
      select: { id_ciclo: true, id_plan: true }
    });
    if (!escenario) {
      return NextResponse.json({ error: 'Escenario no encontrado' }, { status: 404 });
    }

    // ── 1. Todas las asignaciones del ciclo/plan ──
    const asignaciones = await prisma.asignacion.findMany({
      where: {
        id_periodo: periodo.id_periodo,
        curso: {
          ...(escenario.id_ciclo !== undefined ? { id_ciclo: escenario.id_ciclo } : {}),
          ...(escenario.id_plan !== undefined ? { id_plan: escenario.id_plan } : {}),
        }
      },
      include: {
        curso: {
          include: { tipo_sesion: true }
        },
        docente: true,
      }
    });

    // ── 2. Sesiones ya asignadas ──
    const sesiones = await prisma.horario_sesion.findMany({
      where: {
        id_escenario: id,
        asignacion: { id_periodo: periodo.id_periodo }
      },
      include: {
        asignacion: {
          include: { curso: true, periodo: true }
        },
        docente: true,
        aula: true,
        dia_semana: true,
        bloque_horario: true,
        periodo: true
      },
      orderBy: [{ id_dia: 'asc' }, { id_bloque: 'asc' }]
    });

    const schedule = sesiones.map(s => ({
      id: s.id_horario,
      day: s.id_dia,
      slot: s.id_bloque,
      dayName: s.dia_semana.nom_dia,
      slotLabel: `${s.bloque_horario.horario_inicio} - ${s.bloque_horario.horario_fin}`,
      courseName: s.asignacion.curso.nom_curso,
      teacherName: `${s.docente.nom_docente} ${s.docente.ape_docente}`,
      teacherId: s.id_docente,
      roomName: s.aula.nom_aula,
      roomId: s.id_aula,
      type: s.tipo_sesion,
      id_periodo: s.asignacion.periodo.id_periodo,
      nombre_periodo: s.asignacion.periodo.nom_periodo,
      id_curso: s.asignacion.id_curso,
      id_asignacion: s.asignacion.id_asignacion,
      id_docente: s.id_docente,
      id_aula: s.id_aula,
      id_dia: s.id_dia,
      id_bloque: s.id_bloque,
      id_carrera: s.asignacion.curso.id_carrera,
      id_ciclo_curso: s.asignacion.curso.id_ciclo,
    }));

    // ── 3. Disponibilidad docente ──
    const docentes = await prisma.docente.findMany({
      where: {
        competencia_docente: {
          some: {
            curso: {
              ...(escenario.id_ciclo !== undefined ? { id_ciclo: escenario.id_ciclo } : {}),
              ...(escenario.id_plan !== undefined ? { id_plan: escenario.id_plan } : {}),
            }
          }
        }
      },
      include: { disponibilidad_docente: true }
    });

    const teachersAvailability: Record<string, { name: string; availability: Record<number, number[]> }> = {};
    for (const d of docentes) {
      const availability: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
      for (const disp of d.disponibilidad_docente) {
        if (availability[disp.id_dia] !== undefined) {
          availability[disp.id_dia].push(disp.id_bloque);
        }
      }
      teachersAvailability[d.id_docente] = {
        name: `${d.nom_docente} ${d.ape_docente}`,
        availability
      };
    }

    // ── 4. Aulas con tipo ──
    const aulas = await prisma.aula.findMany({
      include: { tipo_aula: true },
      orderBy: { nom_aula: 'asc' }
    });

    // ── 5. Tipo mapping ──
    const tiposSesion = await prisma.tipo_sesion.findMany();
    const tipoMapping: Record<string, string[]> = {};
    for (const ts of tiposSesion) {
      tipoMapping[ts.id_tipo_sesion] = TIPO_AULA_MAP_BY_NAME[ts.nom_tipo_sesion] || ['classroom'];
    }

    return NextResponse.json({
      asignaciones: asignaciones.map(a => ({
        id_asignacion: a.id_asignacion,
        id_docente: a.id_docente,
        id_curso: a.id_curso,
        curso: {
          id_curso: a.curso.id_curso,
          nom_curso: a.curso.nom_curso,
          alumnos: a.curso.alumnos,
          tipo_curso: a.curso.tipo_curso,
          nom_tipo_sesion: a.curso.tipo_sesion.nom_tipo_sesion,
          id_carrera: a.curso.id_carrera,
          id_ciclo: a.curso.id_ciclo,
          horas_teoricas: a.curso.horas_teoricas,
          horas_practicas: a.curso.horas_practicas,
        },
        docente: {
          id_docente: a.docente.id_docente,
          nom_docente: `${a.docente.nom_docente} ${a.docente.ape_docente}`,
        }
      })),
      sessions: schedule,
      teachersAvailability,
      aulas: aulas.map(a => ({
        id_aula: a.id_aula,
        nom_aula: a.nom_aula,
        capacidad: a.capacidad,
        id_tipo_aula: a.id_tipo_aula,
        tipo_aula: { nom_tipo_aula: a.tipo_aula.nom_tipo_aula },
      })),
      tipoMapping,
    });
  } catch (error) {
    console.error('Error fetching edit data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
