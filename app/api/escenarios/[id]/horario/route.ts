import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const sesiones = await prisma.horario_sesion.findMany({
      where: { id_escenario: id },
      include: {
        asignacion: {
          include: {
            curso: true
          }
        },
        docente: true,
        aula: true,
        dia_semana: true,
        bloque_horario: true
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
      type: s.tipo_sesion
    }));

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching scenario schedule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
