import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '../../../lib/prisma';
import { DEFAULT_MODALIDAD } from '../../../lib/constants';
import { getSessionFromRequest, handleApiError } from '@/lib/auth';
import { sanitizeTipoCurso, formatDocenteDisponibilidad } from '@/lib/utils';

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const SLOTS = [
  { inicio: '07:00', fin: '08:20' },
  { inicio: '08:30', fin: '10:00' },
  { inicio: '10:15', fin: '11:45' },
  { inicio: '12:00', fin: '13:30' },
  { inicio: '15:45', fin: '17:15' },
  { inicio: '17:30', fin: '19:00' },
  { inicio: '19:10', fin: '20:40' },
  { inicio: '20:50', fin: '22:20' }
];

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const publishedEscenario = await prisma.escenario.findFirst({
      where: { estado: 'published', creado_por: userId || undefined }
    });

  const periodo = await prisma.periodo_academico.findFirst({
    where: { activo: true }
  });

  const whereClause: any = {
    id_usuario: userId,
    ...(periodo ? { id_periodo: periodo.id_periodo } : {})
  };

  if (publishedEscenario) {
    whereClause.id_escenario = publishedEscenario.id_escenario;
  } else {
    whereClause.id_escenario = null;
  }

  const sessions = await prisma.horario_sesion.findMany({
    where: whereClause,
    include: {
      asignacion: {
        include: {
          curso: {
            include: {
              carrera: true,
              ciclo: true,
            }
          },
          docente: {
            include: {
              disponibilidad_docente: true
            }
          },
          periodo: true
        }
      },
      aula: {
        include: {
          tipo_aula: true
        }
      },
      docente: {
        include: {
          disponibilidad_docente: true
        }
      },
      dia_semana: true,
      bloque_horario: true,
      periodo: true
    }
  });

    const formatted = sessions.map(s => {
      const curso = s.asignacion?.curso;
      const docente = formatDocenteDisponibilidad(s.docente);
      const formattedCurso = curso ? {
        ...curso,
        docente: docente,
        id_docente: docente?.id_docente || null,
      } : null;

      return {
        id_horario: s.id_horario,
        id_curso: s.asignacion?.id_curso || "",
        horario_inicio: s.bloque_horario.horario_inicio,
        horario_fin: s.bloque_horario.horario_fin,
        dia: s.dia_semana.nom_dia,
        id_aula: s.id_aula,
        id_docente: s.id_docente,
        tipo_sesion: s.tipo_sesion,
        curso: formattedCurso,
        aula: s.aula,
        docente: docente,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    return handleApiError(error, 'GET horarios');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await prisma.horario_sesion.deleteMany({ where: { id_usuario: session.userId } });
    return NextResponse.json({ message: 'Todos los horarios eliminados exitosamente' });
  } catch (error) {
    return handleApiError(error, 'DELETE horarios');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = session.userId;

    const datos = await request.json();

    if (!Array.isArray(datos)) {
      return NextResponse.json({ error: 'Formato inválido. Debe ser un arreglo.' }, { status: 400 });
    }

    if (datos.length === 0) {
      return NextResponse.json({ message: 'No hay datos para procesar.' });
    }

    // Detectar si es el formato del planificador interno (guardar horario generado)
    const esGeneradorInterno = datos[0] && (datos[0].courseId !== undefined || datos[0].roomId !== undefined);

    if (esGeneradorInterno) {
      const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
      const idPeriodoActivo = periodo?.id_periodo;
      if (!idPeriodoActivo) {
        return NextResponse.json({ error: 'No hay un periodo académico activo' }, { status: 400 });
      }

      const count = await prisma.$transaction(async (tx) => {
        await tx.horario_sesion.deleteMany({ where: { id_usuario: session.userId } });

        let creadosCount = 0;
        for (const sesion of datos) {
          const { courseId, teacherId, roomId, sessionType, day, slot } = sesion;

          if (courseId && roomId && teacherId && day !== undefined && slot !== undefined) {
            let asg = await tx.asignacion.findFirst({
              where: {
                id_curso: courseId,
                id_periodo: idPeriodoActivo,
              }
            });

            if (!asg) {
              asg = await tx.asignacion.create({
                data: {
                  id_asignacion: `${courseId}-${idPeriodoActivo}`,
                  id_docente: teacherId,
                  id_curso: courseId,
                  id_periodo: idPeriodoActivo,
                }
              });
            } else if (asg.id_docente !== teacherId) {
              asg = await tx.asignacion.update({
                where: { id_asignacion: asg.id_asignacion },
                data: { id_docente: teacherId }
              });
            }

            const aulaData = await tx.aula.findUnique({ where: { id_aula: roomId } });
            const cursoData = await tx.curso.findUnique({ where: { id_curso: courseId } });

            if (aulaData && cursoData && aulaData.capacidad < cursoData.alumnos) {
              throw new Error('El aula seleccionada no tiene capacidad suficiente para el número de alumnos de este curso.');
            }

            await tx.horario_sesion.create({
              data: {
                id_horario: randomUUID(),
                id_asignacion: asg.id_asignacion,
                id_docente: teacherId,
                id_periodo: idPeriodoActivo,
                id_aula: roomId,
                id_dia: day,
                id_bloque: slot,
                tipo_sesion: sessionType || 'theoretical',
                id_usuario: session.userId,
              }
            });
            creadosCount++;
          }
        }
        return creadosCount;
      });

      return NextResponse.json({ message: 'Horario generado guardado exitosamente', count });
    }

    const normalize = (value: any) => String(value ?? '').trim();
    const normalizeRow = (row: any) => {
      const normalized: Record<string, any> = {};
      for (const key of Object.keys(row)) {
        normalized[key.trim().toLowerCase()] = row[key];
      }
      return normalized;
    };
    const pick = (row: any, ...keys: string[]) => {
      for (const key of keys) {
        const value = row[key.toLowerCase()];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
      return '';
    };

    const facultad =
      (await prisma.facultad.findFirst()) ||
      (await prisma.facultad.create({ data: { id_facultad: `F-${randomUUID().slice(0, 8)}`, nom_facultad: 'General' } }));

    const carrera =
      (await prisma.carrera.findFirst()) ||
      (await prisma.carrera.create({ data: { id_carrera: `C-${randomUUID().slice(0, 8)}`, nom_carrera: 'General', id_facultad: facultad.id_facultad } }));

    let ciclo = await prisma.ciclo.findFirst();
    if (!ciclo) {
      ciclo = await prisma.ciclo.create({ data: { id_ciclo: 1, nom_ciclo: '1' } });
    }

    let tipoAula = await prisma.tipo_aula.findFirst();
    if (!tipoAula) {
      tipoAula = await prisma.tipo_aula.create({ data: { id_tipo_aula: `T-${randomUUID().slice(0, 8)}`, nom_tipo_aula: 'General' } });
    }

    const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
    const idPeriodoActivo = periodo?.id_periodo;
    if (!idPeriodoActivo) {
      return NextResponse.json({ error: 'No hay un periodo académico activo' }, { status: 400 });
    }

    await prisma.horario_sesion.deleteMany({ where: { id_usuario: session.userId } });

    for (const [index, filaRaw] of datos.entries()) {
      const fila = normalizeRow(filaRaw);
      const idCurso = normalize(pick(fila, 'id_curso', 'curso')) || `curso-${index + 1}`;
      const cursoName = normalize(pick(fila, 'nom_curso', 'curso', 'CURSO', 'Curso')) || idCurso;
      const idAula = normalize(pick(fila, 'id_aula', 'aula', 'AULA', 'Aula')) || `AULA-${index + 1}`;
      const aulaName = normalize(pick(fila, 'nom_aula', 'aula', 'AULA', 'Aula')) || idAula;
      const idDocente = normalize(pick(fila, 'id_docente', 'docente', 'DOCENTE', 'Docente')) || `DOC-${index + 1}`;
      const docenteName = normalize(pick(fila, 'nom_docente', 'docente', 'DOCENTE', 'Docente')) || idDocente;
      const dia = normalize(pick(fila, 'dia', 'DÍA', 'Dia', 'DIA')) || 'Lunes';
      const horario_inicio_raw = pick(fila, 'horario_inicio', 'INICIO', 'inicio');
      const horario_fin_raw = pick(fila, 'horario_fin', 'FIN', 'fin');

      const parseTimeValue = (value: any) => {
        const normalized = String(value ?? '').trim();
        if (!normalized) return '';
        if (/^\d{1,2}:\d{2}$/.test(normalized)) return normalized;
        const numeric = Number(normalized);
        if (!Number.isNaN(numeric)) {
          const totalMinutes = Math.round(numeric * 24 * 60);
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }
        return normalized;
      };

      const horario_inicio = parseTimeValue(horario_inicio_raw) || '07:00';
      const horario_fin = parseTimeValue(horario_fin_raw) || '09:00';

      // Upsert curso
      await prisma.curso.upsert({
        where: { id_curso: idCurso },
        update: { nom_curso: cursoName },
        create: {
          id_curso: idCurso,
          nom_curso: cursoName,
          creditos: 1,
          id_carrera: carrera.id_carrera,
          modalidad: DEFAULT_MODALIDAD,
          tipo_curso: 'theoretical',
          id_ciclo: ciclo.id_ciclo,
          id_usuario: userId,
        },
      });

      // Upsert aula
      await prisma.aula.upsert({
        where: { id_aula: idAula },
        update: { nom_aula: aulaName },
        create: {
          id_aula: idAula,
          nom_aula: aulaName,
          id_tipo_aula: tipoAula.id_tipo_aula,
          capacidad: 30,
          id_usuario: userId,
        },
      });

      // Upsert docente
      await prisma.docente.upsert({
        where: { id_docente: idDocente },
        update: { nom_docente: docenteName },
        create: {
          id_docente: idDocente,
          dni_docente: '00000000',
          nom_docente: docenteName,
          ape_docente: 'Desconocido',
          nom_especialidad: 'General',
          id_usuario: userId,
        },
      });

      // Asegurar asignación docente-curso
      let asg = await prisma.asignacion.findUnique({
        where: {
          id_docente_id_curso_id_periodo: {
            id_docente: idDocente,
            id_curso: idCurso,
            id_periodo: idPeriodoActivo,
          }
        }
      });

      if (!asg) {
        asg = await prisma.asignacion.create({
          data: {
            id_asignacion: `${idCurso}-${idPeriodoActivo}`,
            id_docente: idDocente,
            id_curso: idCurso,
            id_periodo: idPeriodoActivo,
          }
        });
      }

      // Mapear Dia y Bloque Horario
      const diaIndex = DAYS.indexOf(dia);
      const id_dia = diaIndex !== -1 ? diaIndex : 0;

      let id_bloque = 0;
      const slotIndex = SLOTS.findIndex(s => s.inicio === horario_inicio || s.fin === horario_fin);
      if (slotIndex !== -1) {
        id_bloque = slotIndex;
      }

      // Validar capacidad del aula vs alumnos del curso
      const aulaData_ = await prisma.aula.findUnique({ where: { id_aula: idAula } });
      const cursoData_ = await prisma.curso.findUnique({ where: { id_curso: idCurso } });

      if (aulaData_ && cursoData_ && aulaData_.capacidad < cursoData_.alumnos) {
        throw new Error('El aula seleccionada no tiene capacidad suficiente para el número de alumnos de este curso.');
      }

      // Crear sesión de horario
      await prisma.horario_sesion.create({
        data: {
          id_horario: randomUUID(),
          id_asignacion: asg.id_asignacion,
          id_docente: idDocente,
          id_periodo: idPeriodoActivo,
          id_aula: idAula,
          id_dia: id_dia,
          id_bloque: id_bloque,
          tipo_sesion: 'theoretical',
          id_usuario: userId,
        },
      });
    }

    return NextResponse.json({ message: 'Importado con éxito' });
  } catch (error) {
    if (error instanceof Error && error.message === 'El aula seleccionada no tiene capacidad suficiente para el número de alumnos de este curso.') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleApiError(error, 'POST horarios (import)');
  }
}