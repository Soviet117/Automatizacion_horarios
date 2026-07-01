import { prisma } from './prisma';

interface OptimizationRequest {
  teachers: any[];
  classes: any[];
  rooms: any[];
  days: number;
  slots_per_day: number;
}

export class SchedulerService {
  /**
   * Recopila los datos de la base de datos y los envía al solucionador CSP en Python.
   */
  static async optimizeSchedule(userId: string, id_escenario?: string) {
    // 0. Obtener periodo activo para filtrar solo asignaciones relevantes
    const periodoActivo = await prisma.periodo_academico.findFirst({
      where: { activo: true }
    });

    if (!periodoActivo) {
      throw new Error('No hay un periodo académico activo. Activa uno antes de generar horarios.');
    }

    // 1. Obtener datos crudos de Prisma (solo del periodo activo)
    const [docentesDB, aulasDB, asignacionesDB] = await Promise.all([
      prisma.docente.findMany({
        include: {
          disponibilidad_docente: true,
          competencia_docente: true
        }
      }),
      prisma.aula.findMany(),
      prisma.asignacion.findMany({
        where: { id_periodo: periodoActivo.id_periodo },
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

    // 2. Transformar al formato del Microservicio Python (OptimizationRequest)
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
      cohort_id: `${a.curso.id_carrera}-${a.curso.id_ciclo}`, // Agrupar por carrera y ciclo para concurrencia real
      required_hours: (a.curso.horas_teoricas || 0) + (a.curso.horas_practicas || 0) || 4,
      students_count: a.curso.alumnos || 30,
      teacher_id: a.id_docente
    }));

    const payload: OptimizationRequest = {
      teachers,
      rooms,
      classes,
      days: 5,
      slots_per_day: 5
    };

    // 3. Llamar al Microservicio
    console.log('Enviando datos al motor CSP (OR-Tools)...');
    const cspUrl = process.env.CSP_SOLVER_URL || 'http://localhost:8000';
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

    if (data.status === 'INFEASIBLE') {
      throw new Error('No existe una combinación factible que satisfaga todas las restricciones. Revisa la disponibilidad de los docentes o la capacidad de las aulas.');
    }

    if (data.status !== 'SUCCESS') {
      throw new Error(`El solucionador finalizó con estado desconocido: ${data.status}`);
    }

    // 4. Procesar el resultado y guardar en Prisma (Transacción)
    const sessions = data.sessions;

    let targetEscenarioId = id_escenario;

    await prisma.$transaction(async (tx) => {
      // Si no hay escenario destino, creamos uno de simulación
      if (!targetEscenarioId) {
        const nuevoEsc = await tx.escenario.create({
          data: {
            nom_escenario: `Generación Automática ${new Date().toLocaleDateString()}`,
            descripcion: 'Horario generado por el Optimizador',
            estado: 'simulation',
            creado_por: userId,
            cobertura: 100, // asumiendo éxito total, idealmente esto se calcula
            conflictos: 0
          }
        });
        targetEscenarioId = nuevoEsc.id_escenario;
      } else {
        // Limpiar horarios anteriores del escenario objetivo
        await tx.horario_sesion.deleteMany({
          where: { id_escenario: targetEscenarioId }
        });
      }

      // Crear las nuevas sesiones asignadas por el solucionador
      const newSessions = sessions.map((s: any) => ({
        id_horario: crypto.randomUUID(),
        id_asignacion: s.class_id,
        id_docente: s.teacher_id,
        id_aula: s.room_id,
        id_dia: s.day,
        id_bloque: s.slot,
        id_periodo: periodoActivo.id_periodo,
        tipo_sesion: asignacionesDB.find(a => a.id_asignacion === s.class_id)?.curso?.tipo_curso ?? 'Teórica',
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
      message: data.message,
      total_sessions_assigned: sessions.length,
      escenario_id: targetEscenarioId
    };
  }
}
