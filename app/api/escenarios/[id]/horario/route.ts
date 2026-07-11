import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await props.params;

    const periodo = await prisma.periodo_academico.findFirst({
      where: { activo: true, id_usuario: session.userId }
    });
    if (!periodo) {
      return NextResponse.json({ error: 'No hay periodo académico activo' }, { status: 400 });
    }

    const userFilter = { id_usuario: session.userId };

    const [sesiones, escenario] = await Promise.all([
      prisma.horario_sesion.findMany({
        where: {
          id_escenario: id,
          // El id_escenario ya discrimina unívocamente las sesiones.
          // NO filtrar por periodo de la asignación: haría invisible cualquier
          // sesión cuya asignación pertenezca a un periodo distinto al activo,
          // devolviendo datos de una optimización anterior.
        },
        include: {
          asignacion: {
            include: {
              curso: true,
              periodo: true
            }
          },
          docente: true,
          aula: true,
          dia_semana: true,
          bloque_horario: true,
          periodo: true
        },
        orderBy: [
          { id_dia: 'asc' },
          { id_bloque: 'asc' }
        ]
      }),
      prisma.escenario.findUnique({
        where: { id_escenario: id },
        select: { id_ciclo: true, id_plan: true }
      })
    ]);

    const docentes = await prisma.docente.findMany({
      where: {
        ...userFilter,
        competencia_docente: {
          some: {
            curso: {
              ...(escenario?.id_ciclo != null ? { id_ciclo: escenario.id_ciclo } : {}),
              ...(escenario?.id_plan != null ? { id_plan: escenario.id_plan } : {}),
            }
          }
        }
      },
      include: {
        disponibilidad_docente: true
      }
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
      id_bloque: s.id_bloque
    }));

    return NextResponse.json({ sessions: schedule, teachersAvailability });
  } catch (error) {
    console.error('Error fetching scenario schedule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
