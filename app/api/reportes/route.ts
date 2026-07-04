import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');

    if (!periodo) {
      return NextResponse.json({ error: 'Falta el parámetro periodo' }, { status: 400 });
    }

    // 1. KPI Resumen
    const totalMaterias = await prisma.curso.count();

    // Total horas asignadas (cada bloque cuenta como 1 hora o sesión)
    const totalSesiones = await prisma.horario_sesion.count({
      where: { id_periodo: periodo, id_escenario: null },
    });

    // 2. Uso de Aulas
    const aulas = await prisma.aula.findMany({
      include: {
        horario_sesion: {
          where: { id_periodo: periodo, id_escenario: null },
        }
      }
    });

    const maxBloquesSemana = 5 * 5; // Suposición: 5 bloques por día, 5 días

    const roomUsageData = aulas.map(a => {
      const assigned = a.horario_sesion.length;
      const usagePercentage = (assigned / maxBloquesSemana) * 100;
      return {
        name: a.nom_aula,
        usage: Math.min(Math.round(usagePercentage), 100),
        capacity: a.capacidad
      }
    }).sort((a, b) => b.usage - a.usage).slice(0, 10); // Top 10 aulas más usadas

    // Si no hay datos, enviamos algo mínimo para evitar gráficos rotos
    if (roomUsageData.length === 0) {
      roomUsageData.push({ name: 'Sin datos', usage: 0, capacity: 0 });
    }

    // 3. Distribución por Programa
    const carreras = await prisma.carrera.findMany({
      include: {
        curso: true
      }
    });

    const programData = carreras.map(c => {
      const totalAlumnos = c.curso.reduce((sum, curso) => sum + curso.alumnos, 0);
      return {
        name: c.nom_carrera,
        value: totalAlumnos
      }
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    const totalAlumnosGeneral = programData.reduce((sum, p) => sum + p.value, 0);
    const programDataPercentage = programData.map(p => ({
      name: p.name,
      value: totalAlumnosGeneral > 0 ? Math.round((p.value / totalAlumnosGeneral) * 100) : 0
    }));

    if (programDataPercentage.length === 0) {
      programDataPercentage.push({ name: 'Sin datos', value: 100 });
    }

    // 4. Carga Docente
    const docentes = await prisma.docente.findMany({
      include: {
        horario_sesion: {
          where: { id_periodo: periodo, id_escenario: null },
        }
      }
    });

    const teacherLoadData = docentes.map(d => {
      const assigned = d.horario_sesion.length;
      return {
        name: `${d.nom_docente.split(' ')[0]} ${d.ape_docente.split(' ')[0]}`,
        assigned: assigned,
        max: 25 // 5 bloques × 5 días
      }
    }).filter(d => d.assigned > 0).sort((a, b) => b.assigned - a.assigned).slice(0, 10);

    if (teacherLoadData.length === 0) {
      teacherLoadData.push({ name: 'Sin datos', assigned: 0, max: 25 });
    }

    // 5. Ocupación Semanal
    const dias = await prisma.dia_semana.findMany({
      orderBy: { id_dia: 'asc' }
    });

    const weeklyData = await Promise.all(dias.map(async (dia) => {
      const sesionesDia = await prisma.horario_sesion.findMany({
        where: { id_periodo: periodo, id_dia: dia.id_dia, id_escenario: null },
        select: { id_aula: true, id_docente: true }
      });

      const aulasUnicas = new Set(sesionesDia.map(s => s.id_aula)).size;
      const docentesUnicos = new Set(sesionesDia.map(s => s.id_docente)).size;

      return {
        day: dia.nom_dia.substring(0, 3), // Ej. "Lunes" -> "Lun"
        aulas: aulasUnicas,
        docentes: docentesUnicos
      };
    }));

    // Stats
    const totalDocentesConCarga = teacherLoadData.filter(t => t.name !== 'Sin datos').length;

    // Utilización media: promedio de TODAS las aulas (no solo top 10)
    const todasAulas = await prisma.aula.findMany({
      include: {
        horario_sesion: {
          where: { id_periodo: periodo, id_escenario: null },
        }
      }
    });
    const utilizacionMedia = todasAulas.length > 0
      ? Math.round(
          todasAulas.reduce((acc, a) => acc + Math.min((a.horario_sesion.length / maxBloquesSemana) * 100, 100), 0)
          / todasAulas.length
        )
      : 0;

    const cargaDocenteMedia = totalDocentesConCarga > 0
      ? Math.round(teacherLoadData.reduce((acc, curr) => acc + curr.assigned, 0) / totalDocentesConCarga)
      : 0;

    // Cobertura real: materias que tienen al menos una asignación en el período
    const asignacionesPeriodo = await prisma.asignacion.findMany({
      where: { id_periodo: periodo },
      select: { id_curso: true }
    });
    const cursosConAsignacion = new Set(asignacionesPeriodo.map(a => a.id_curso)).size;
    const materiasCubiertos = totalMaterias > 0
      ? Math.min(Math.round((cursosConAsignacion / totalMaterias) * 100), 100)
      : 0;

    const stats = {
      utilizacionMedia,
      cargaDocenteMedia,
      materiasCubiertos,
      horasAsignadas: totalSesiones
    };

    return NextResponse.json({
      roomUsageData,
      teacherLoadData,
      weeklyData,
      programData: programDataPercentage,
      stats
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
