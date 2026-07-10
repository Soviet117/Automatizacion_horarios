import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      usuarios,
      cursos,
      docentes,
      aulas,
      horarios,
      escenarios,
      asignaciones,
      periodos,
      facultades,
      carreras,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.curso.count(),
      prisma.docente.count(),
      prisma.aula.count(),
      prisma.horario_sesion.count(),
      prisma.escenario.count(),
      prisma.asignacion.count(),
      prisma.periodo_academico.count(),
      prisma.facultad.count(),
      prisma.carrera.count(),
    ]);

    const cursosConUsuario = await prisma.curso.count({ where: { id_usuario: { not: null } } });
    const docentesConUsuario = await prisma.docente.count({ where: { id_usuario: { not: null } } });
    const aulasConUsuario = await prisma.aula.count({ where: { id_usuario: { not: null } } });

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      counts: {
        usuarios,
        cursos,
        docentes,
        aulas,
        horarios_sesiones: horarios,
        escenarios,
        asignaciones,
        periodos,
        facultades,
        carreras,
      },
      perUser: {
        cursos_sin_usuario: cursos - cursosConUsuario,
        cursos_con_usuario: cursosConUsuario,
        docentes_sin_usuario: docentes - docentesConUsuario,
        docentes_con_usuario: docentesConUsuario,
        aulas_sin_usuario: aulas - aulasConUsuario,
        aulas_con_usuario: aulasConUsuario,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
