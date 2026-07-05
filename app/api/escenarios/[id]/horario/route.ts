import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
    if (!periodo) {
      return NextResponse.json({ error: 'No hay periodo académico activo' }, { status: 400 });
    }

    const sesiones = await prisma.horario_sesion.findMany({
      where: {
        id_escenario: id,
        asignacion: { id_periodo: periodo.id_periodo }
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
    });

    // Mapear para el frontend
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

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching scenario schedule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
