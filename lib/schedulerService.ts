import { prisma } from './prisma';

interface OptimizationRequest {
  teachers: any[];
  classes: any[];
  rooms: any[];
  days: number;
  slots_per_day: number;
  relaxed: boolean;
}

interface CompetenciaDocente {
  id_curso: string;
}

interface DocenteWithCompetencias {
  id_docente: string;
  competencia_docente: CompetenciaDocente[];
}

export class SchedulerService {
  static async optimizeSchedule(userId: string, id_escenario?: string) {
    const periodoActivo = await prisma.periodo_academico.findFirst({
      where: { activo: true }
    });

    if (!periodoActivo) {
      throw new Error('No hay un periodo académico activo. Activa uno antes de generar horarios.');
    }

    let filtroCiclo: number | undefined;
    let filtroPlan: string | undefined;
    if (id_escenario) {
      const escenario = await prisma.escenario.findUnique({
        where: { id_escenario },
        select: { id_ciclo: true, id_plan: true }
      });
      if (escenario) {
        filtroCiclo = escenario.id_ciclo ?? undefined;
        filtroPlan = escenario.id_plan ?? undefined;
      }
    }

    const [docentesDB, aulasDB, asignacionesDB] = await Promise.all([
      prisma.docente.findMany({
        include: {
          disponibilidad_docente: true,
          competencia_docente: true
        }
      }),
      prisma.aula.findMany(),
      prisma.asignacion.findMany({
        where: {
          id_periodo: periodoActivo.id_periodo,
          curso: {
            ...(filtroCiclo !== undefined ? { id_ciclo: filtroCiclo } : {}),
            ...(filtroPlan !== undefined ? { id_plan: filtroPlan } : {}),
          }
        },
        include: {
          curso: true,
          periodo: true
        }
      })
    ]);

    if (docentesDB.length === 0 || aulasDB.length === 0 || asignacionesDB.length === 0) {
      throw new Error('Faltan datos maestros (Docentes, Aulas o Asignaciones) para generar el horario.');
    }

    console.log(`[Scheduler] Periodo activo: ${periodoActivo.id_periodo}, Asignaciones a resolver: ${asignacionesDB.length}`);

    const teachers = docentesDB.map(d => ({
      id: d.id_docente,
      max_hours: 40,
      availabilities: d.disponibilidad_docente.map(disp => ({
        day: disp.id_dia,
        slot: disp.id_bloque
      })),
      competencies: d.competencia_docente.map(comp => comp.id_curso)
    }));

    const rooms = aulasDB.map(a => ({
      id: a.id_aula,
      capacity: a.capacidad
    }));

    const classes = asignacionesDB.map(a => ({
      id: a.id_asignacion,
      course_id: a.id_curso,
      cohort_id: `${a.curso.id_carrera}-${a.curso.id_ciclo}`,
      required_hours: (a.curso.horas_teoricas || 0) + (a.curso.horas_practicas || 0) || 4,
      students_count: a.curso.alumnos || 30,
      teacher_id: a.id_docente
    }));

    SchedulerService.validateAssignmentCompetencies(docentesDB, asignacionesDB);

    const cspUrl = process.env.CSP_SOLVER_URL || 'http://localhost:8000';

    // Try hard constraints first
    let data = await SchedulerService.callSolver(cspUrl, { teachers, rooms, classes, days: 5, slots_per_day: 5, relaxed: false });

    // If infeasible, retry in relaxed mode
    if (data.status === 'INFEASIBLE') {
      console.log('[Scheduler] Hard constraints infeasible, retrying in relaxed mode...');
      data = await SchedulerService.callSolver(cspUrl, { teachers, rooms, classes, days: 5, slots_per_day: 5, relaxed: true });
    }

    return await SchedulerService.saveResults(data, periodoActivo, asignacionesDB, userId, id_escenario);
  }

  private static async callSolver(cspUrl: string, payload: any) {
    console.log(`[Scheduler] Enviando datos al motor CSP (relaxed: ${payload.relaxed})...`);
    let response;
    try {
      response = await fetch(`${cspUrl}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      throw new Error('No se pudo conectar con el motor CSP (Python). ¿Está corriendo en el puerto 8000?');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en el motor CSP: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'ERROR') {
      throw new Error(`Error en el motor CSP: ${data.message}`);
    }

    return data;
  }

  private static async saveResults(data: any, periodoActivo: any, asignacionesDB: any[], userId: string, id_escenario?: string) {
    const sessions = data.sessions || [];
    const coverage = data.coverage ?? 100;

    if (data.status === 'INFEASIBLE' && sessions.length === 0) {
      throw new Error('No existe una combinación factible que satisfaga todas las restricciones. Revisa la disponibilidad de los docentes o la capacidad de las aulas.');
    }

    if (data.status === 'TIMEOUT') {
      throw new Error('El motor CSP agotó el tiempo límite. Prueba reduciendo el número de clases.');
    }

    let targetEscenarioId = id_escenario;

    await prisma.$transaction(async (tx) => {
      if (!targetEscenarioId) {
        const nuevoEsc = await tx.escenario.create({
          data: {
            nom_escenario: `Generación Automática ${new Date().toLocaleDateString()}`,
            descripcion: coverage < 100
              ? `Horario generado (parcial: ${coverage}% de cobertura)`
              : 'Horario generado por el Optimizador',
            estado: 'simulation',
            creado_por: userId,
            cobertura: Math.round(coverage),
            conflictos: coverage < 100 ? Math.round(100 - coverage) : 0
          }
        });
        targetEscenarioId = nuevoEsc.id_escenario;
      } else {
        await tx.horario_sesion.deleteMany({
          where: { id_escenario: targetEscenarioId }
        });
        await tx.escenario.update({
          where: { id_escenario: targetEscenarioId },
          data: {
            cobertura: Math.round(coverage),
            conflictos: coverage < 100 ? Math.round(100 - coverage) : 0
          }
        });
      }

      const newSessions = sessions.map((s: any) => ({
        id_horario: crypto.randomUUID(),
        id_asignacion: s.class_id,
        id_docente: s.teacher_id,
        id_aula: s.room_id,
        id_dia: s.day,
        id_bloque: s.slot,
        id_periodo: periodoActivo.id_periodo,
        tipo_sesion: asignacionesDB.find((a: any) => a.id_asignacion === s.class_id)?.curso?.tipo_curso ?? 'Teórica',
        id_usuario: null,
        id_escenario: targetEscenarioId
      }));

      if (newSessions.length > 0) {
        await tx.horario_sesion.createMany({
          data: newSessions
        });
      }
    });

    return {
      message: data.message || 'Horario generado exitosamente.',
      total_sessions_assigned: sessions.length,
      escenario_id: targetEscenarioId,
      coverage
    };
  }

  static validateAssignmentCompetencies(
    docentesDB: DocenteWithCompetencias[],
    asignacionesDB: any[]
  ): void {
    const teacherCompetencies = new Map(
      docentesDB.map(d => [
        d.id_docente,
        new Set(d.competencia_docente.map(c => c.id_curso))
      ])
    );

    const violations: string[] = [];

    for (const a of asignacionesDB) {
      const comps = teacherCompetencies.get(a.id_docente);
      if (!comps || !comps.has(a.id_curso)) {
        violations.push(
          `Docente "${a.id_docente}" no tiene competencia para el curso "${a.id_curso}"`
        );
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Violaciones de competencias docentes:\n${violations.join('\n')}`
      );
    }
  }
}
