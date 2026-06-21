import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const escenarios = await prisma.escenario.findMany({
      orderBy: [
        { estado: 'asc' }, // published first (alphabetically closest)
        { creado_el: 'desc' }
      ],
      include: {
        horario_sesion: {
          include: {
            asignacion: {
              include: {
                curso: true,
                docente: true,
              }
            },
            docente: true,
            aula: true,
            dia_semana: true,
            bloque_horario: true,
          }
        }
      }
    });

    // Sort so published is always first
    const sorted = [...escenarios].sort((a, b) => {
      if (a.estado === 'published') return -1;
      if (b.estado === 'published') return 1;
      return b.creado_el.getTime() - a.creado_el.getTime();
    });

    const result = sorted.map(e => ({
      id: e.id_escenario,
      name: e.nom_escenario,
      status: e.estado as 'published' | 'draft' | 'simulation',
      createdAt: e.creado_el.toISOString().split('T')[0],
      createdBy: e.creado_por ?? 'Sistema',
      coverage: e.cobertura,
      conflicts: e.conflictos,
      sessions: e.horario_sesion.map(s => ({
        id: s.id_horario,
        day: s.id_dia,
        slot: s.id_bloque,
        course: s.asignacion?.curso?.nom_curso ?? `Curso ${s.id_asignacion?.slice(0, 6)}`,
        teacher: s.docente
          ? `${s.docente.nom_docente} ${s.docente.ape_docente}`.trim()
          : 'Sin docente',
        room: s.aula?.nom_aula ?? s.id_aula,
        tipo: s.tipo_sesion,
      }))
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error en /api/escenarios-con-sesiones:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
