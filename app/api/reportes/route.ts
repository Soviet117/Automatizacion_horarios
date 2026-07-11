import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');

    if (!periodo) {
      return NextResponse.json({ error: 'Falta el parámetro periodo' }, { status: 400 });
    }

    const userFilter = userId ? { id_usuario: userId } : {};

    // ── 1. Determinar escenarios a reportar ──────────────────────────────────
    // Prioridad: escenario publicado → todos los escenarios del usuario en el periodo
    const escenarios = await prisma.escenario.findMany({
      where: { creado_por: userId ?? undefined },
      select: { id_escenario: true, estado: true }
    });

    const publishedIds = escenarios
      .filter(e => e.estado === 'published')
      .map(e => e.id_escenario);

    const allIds = escenarios.map(e => e.id_escenario);

    // Usar publicados si existen, sino todos los escenarios del usuario
    const targetEscenarioIds = publishedIds.length > 0 ? publishedIds : allIds;

    // Filtro base para horario_sesion: periodo + escenarios objetivo
    const sessionBaseWhere = {
      id_periodo: periodo,
      ...(targetEscenarioIds.length > 0
        ? { id_escenario: { in: targetEscenarioIds } }
        : { id_escenario: null }  // fallback: sesiones legacy sin escenario
      ),
    };

    // ── 2. Total de materias (cursos) del usuario ────────────────────────────
    const totalMaterias = await prisma.curso.count({ where: userFilter });

    // ── 3. Total sesiones asignadas ─────────────────────────────────────────
    const totalSesiones = await prisma.horario_sesion.count({
      where: sessionBaseWhere,
    });

    // ── 4. Uso de aulas ─────────────────────────────────────────────────────
    const aulas = await prisma.aula.findMany({
      where: userFilter,
      include: {
        horario_sesion: {
          where: sessionBaseWhere,
        }
      }
    });

    const maxBloquesSemana = 8 * 5; // 40 bloques

    const roomUsageData = aulas
      .map(a => ({
        name: a.nom_aula,
        usage: Math.min(Math.round((a.horario_sesion.length / maxBloquesSemana) * 100), 100),
        capacity: a.capacidad,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    if (roomUsageData.length === 0) {
      roomUsageData.push({ name: 'Sin datos', usage: 0, capacity: 0 });
    }

    // ── 5. Distribución por programa (carreras → alumnos) ───────────────────
    const carreras = await prisma.carrera.findMany({
      where: userFilter,
      include: { curso: true }
    });

    const programData = carreras
      .map(c => ({
        name: c.nom_carrera,
        value: c.curso.reduce((sum, curso) => sum + (curso.alumnos || 0), 0),
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalAlumnosGeneral = programData.reduce((sum, p) => sum + p.value, 0);
    const programDataPercentage = programData.map(p => ({
      name: p.name,
      value: totalAlumnosGeneral > 0 ? Math.round((p.value / totalAlumnosGeneral) * 100) : 0,
    }));

    if (programDataPercentage.length === 0) {
      programDataPercentage.push({ name: 'Sin datos', value: 100 });
    }

    // ── 6. Carga horaria docente ─────────────────────────────────────────────
    const docentes = await prisma.docente.findMany({
      where: userFilter,
      include: {
        horario_sesion: {
          where: sessionBaseWhere,
        }
      }
    });

    const teacherLoadData = docentes
      .map(d => ({
        name: `${d.nom_docente.split(' ')[0]} ${d.ape_docente.split(' ')[0]}`,
        assigned: d.horario_sesion.length,
        max: 40,
      }))
      .filter(d => d.assigned > 0)
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 10);

    if (teacherLoadData.length === 0) {
      teacherLoadData.push({ name: 'Sin datos', assigned: 0, max: 25 });
    }

    // ── 7. Ocupación por día ─────────────────────────────────────────────────
    const dias = await prisma.dia_semana.findMany({ orderBy: { id_dia: 'asc' } });

    const weeklyData = await Promise.all(
      dias.map(async dia => {
        const sesionesDia = await prisma.horario_sesion.findMany({
          where: { ...sessionBaseWhere, id_dia: dia.id_dia },
          select: { id_aula: true, id_docente: true },
        });

        return {
          day: dia.nom_dia.substring(0, 3),
          aulas: new Set(sesionesDia.map(s => s.id_aula)).size,
          docentes: new Set(sesionesDia.map(s => s.id_docente)).size,
        };
      })
    );

    // ── 8. KPIs generales ────────────────────────────────────────────────────
    const totalDocentesConCarga = teacherLoadData.filter(t => t.name !== 'Sin datos').length;

    const utilizacionMedia =
      aulas.length > 0
        ? Math.round(
            aulas.reduce(
              (acc, a) =>
                acc +
                Math.min((a.horario_sesion.length / maxBloquesSemana) * 100, 100),
              0
            ) / aulas.length
          )
        : 0;

    const cargaDocenteMedia =
      totalDocentesConCarga > 0
        ? Math.round(
            teacherLoadData.reduce((acc, d) => acc + d.assigned, 0) /
              totalDocentesConCarga
          )
        : 0;

    const asignacionesPeriodo = await prisma.asignacion.findMany({
      where: { id_periodo: periodo, ...userFilter },
      select: { id_curso: true },
    });
    const cursosConAsignacion = new Set(asignacionesPeriodo.map(a => a.id_curso)).size;
    const materiasCubiertos =
      totalMaterias > 0
        ? Math.min(Math.round((cursosConAsignacion / totalMaterias) * 100), 100)
        : 0;

    const stats = {
      utilizacionMedia,
      cargaDocenteMedia,
      materiasCubiertos,
      horasAsignadas: totalSesiones,
      // Metadatos de contexto (útil para debug/transparencia)
      escenariosModo: publishedIds.length > 0 ? 'published' : 'all',
      escenariosCount: targetEscenarioIds.length,
    };

    return NextResponse.json({
      roomUsageData,
      teacherLoadData,
      weeklyData,
      programData: programDataPercentage,
      stats,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
