import { prisma } from './prisma';
import { TIPO_AULA_MAP_BY_NAME } from './tipoAulaMap';

interface OptimizationRequest {
  teachers: any[];
  classes: any[];
  rooms: any[];
  days: number;
  slots_per_day: number;
  relaxed: boolean;
  tipo_aula_map?: Record<string, string[]>;
}

interface CompetenciaDocente {
  id_curso: string;
}

interface DocenteWithCompetencias {
  id_docente: string;
  competencia_docente: CompetenciaDocente[];
}

export class SchedulerService {
  private static async getCspConfig() {
    const config = await prisma.configuracion_csp.findUnique({
      where: { id: 'global' }
    });
    return config ?? {
      dias_por_semana: 5,
      bloques_por_dia: 8,
      horas_max_por_profesor: 40,
      timeout_segundos: 60,
      modo_relajado: false,
      sesiones_max_por_dia_profesor: 1,
    };
  }

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
      prisma.aula.findMany({
        include: { tipo_aula: true }
      }),
      prisma.asignacion.findMany({
        where: {
          id_periodo: periodoActivo.id_periodo,
          curso: {
            ...(filtroCiclo !== undefined ? { id_ciclo: filtroCiclo } : {}),
            ...(filtroPlan !== undefined ? { id_plan: filtroPlan } : {}),
          }
        },
        include: {
          curso: { include: { tipo_sesion: true } },
          periodo: true
        }
      })
    ]);

    if (docentesDB.length === 0 || aulasDB.length === 0 || asignacionesDB.length === 0) {
      throw new Error('Faltan datos maestros (Docentes, Aulas o Asignaciones) para generar el horario.');
    }

    console.log(`[Scheduler] Periodo activo: ${periodoActivo.id_periodo}, Asignaciones a resolver: ${asignacionesDB.length}`);

    const cspConfig = await SchedulerService.getCspConfig();

    const teachers = docentesDB.map(d => ({
      id: d.id_docente,
      max_hours: cspConfig.horas_max_por_profesor,
      availabilities: d.disponibilidad_docente.map(disp => ({
        day: disp.id_dia,
        slot: disp.id_bloque
      })),
      competencies: d.competencia_docente.map(comp => comp.id_curso)
    }));

    const rooms = aulasDB.map(a => ({
      id: a.id_aula,
      capacity: a.capacidad,
      tipo_aula: a.tipo_aula.id_tipo_aula
    }));

    const classes = asignacionesDB.flatMap(a => {
      const baseId = a.id_asignacion;
      const ht = a.curso.horas_teoricas || 0;
      const hp = a.curso.horas_practicas || 0;
      const tipoCurso = a.curso.tipo_sesion?.nom_tipo_sesion || 'Teoría';
      const blocks: any[] = [];
      const total = ht + hp;

      for (let i = 0; i < (total || 1); i++) {
        const isTeorica = i < ht;
        blocks.push({
          id: `${baseId}~${isTeorica ? 'Teoría' : tipoCurso}~${i}`,
          course_id: a.id_curso,
          cohort_id: `${a.curso.id_carrera}-${a.curso.id_ciclo}`,
          required_hours: 1,
          students_count: a.curso.alumnos || 30,
          teacher_id: a.id_docente,
          tipo_sesion: isTeorica ? 'Teoría' : tipoCurso,
        });
      }
      return blocks;
    });

    SchedulerService.validateAssignmentCompetencies(docentesDB, asignacionesDB);

    const cspUrl = process.env.CSP_SOLVER_URL || 'http://localhost:8000';

    const payload = {
      teachers, rooms, classes,
      days: cspConfig.dias_por_semana,
      slots_per_day: cspConfig.bloques_por_dia,
      relaxed: cspConfig.modo_relajado,
      tipo_aula_map: TIPO_AULA_MAP_BY_NAME,
      timeout_segundos: cspConfig.timeout_segundos,
      sesiones_max_por_dia_profesor: cspConfig.sesiones_max_por_dia_profesor,
    };

    // Try hard constraints first
    let data = await SchedulerService.callSolver(cspUrl, payload);

    // If infeasible, retry in relaxed mode
    if (data.status === 'INFEASIBLE') {
      console.log('[Scheduler] Hard constraints infeasible, retrying in relaxed mode...');
      data = await SchedulerService.callSolver(cspUrl, { ...payload, relaxed: true });
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
    const unassignedRaw = data.unassigned || [];

    if (data.status === 'INFEASIBLE' && sessions.length === 0) {
      // Build detailed error with unassigned info
      let msg = 'No existe una combinación factible que satisfaga todas las restricciones.';
      if (unassignedRaw.length > 0) {
        const reasons = unassignedRaw.map((u: any) => u.reason);
        msg += ` Cursos sin asignar: ${unassignedRaw.length}.`;
      }
      throw new Error(msg);
    }

    if (data.status === 'TIMEOUT') {
      throw new Error('El motor CSP agotó el tiempo límite. Prueba reduciendo el número de clases.');
    }

    // Build a lookup: compound class_id → { originalId, tipo_sesion, curso }
    const classLookup = new Map<string, { originalId: string; tipoSesion: string; curso: any }>();
    for (const a of asignacionesDB) {
      const tipoCurso = a.curso.tipo_sesion?.nom_tipo_sesion || 'Teoría';
      const ht = a.curso.horas_teoricas || 0;
      const hp = a.curso.horas_practicas || 0;
      const total = ht + hp;
      for (let i = 0; i < (total || 1); i++) {
        const isTeorica = i < ht;
        const tipo = isTeorica ? 'Teoría' : tipoCurso;
        classLookup.set(`${a.id_asignacion}~${tipo}~${i}`, { originalId: a.id_asignacion, tipoSesion: tipo, curso: a.curso });
      }
    }

    // Map unassigned data with course and teacher names
    const unassigned = unassignedRaw.map((u: any) => {
      const lookup = classLookup.get(u.class_id);
      return {
        courseName: lookup?.curso?.nom_curso ?? u.course_id,
        teacherName: '', // filled below
        teacherId: u.teacher_id,
        assignmentId: u.class_id,
        courseId: u.course_id,
        reason: u.reason,
        requiredHours: u.required_hours,
        cohortId: lookup ? `${lookup.curso.id_carrera}-${lookup.curso.id_ciclo}` : ''
      };
    });

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

      const newSessions = sessions.map((s: any) => {
        const lookup = classLookup.get(s.class_id);
        const originalId = lookup?.originalId || s.class_id;
        const sessionTipo = lookup?.tipoSesion || 'Teoría';
        return {
          id_horario: crypto.randomUUID(),
          id_asignacion: originalId,
          id_docente: s.teacher_id,
          id_aula: s.room_id,
          id_dia: s.day,
          id_bloque: s.slot,
          id_periodo: periodoActivo.id_periodo,
          tipo_sesion: sessionTipo,
          id_usuario: null,
          id_escenario: targetEscenarioId
        };
      });

      if (newSessions.length > 0) {
        await tx.horario_sesion.createMany({
          data: newSessions
        });
      }
    });

    // Fill teacher names from DB
    if (unassigned.length > 0) {
      const teacherIds = [...new Set(unassigned.map((u: any) => u.teacherId))] as string[];
      const teachers = await prisma.docente.findMany({
        where: { id_docente: { in: teacherIds } },
        select: { id_docente: true, nom_docente: true, ape_docente: true }
      });
      const teacherMap = new Map(teachers.map(t => [t.id_docente, `${t.nom_docente} ${t.ape_docente}`]));
      for (const u of unassigned) {
        u.teacherName = teacherMap.get(u.teacherId) ?? 'Docente';
      }
    }

    return {
      message: data.message || 'Horario generado exitosamente.',
      total_sessions_assigned: sessions.length,
      escenario_id: targetEscenarioId,
      coverage,
      unassigned
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
