import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '../../../lib/prisma';

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

const sanitizeTipoCurso = (type: string): string => {
  const t = String(type ?? '').trim().toLowerCase();
  if (['theoretical', 'programming', 'electronics', 'nursing'].includes(t)) {
    return t;
  }
  if (t.includes('teoric') || t.includes('obligatorio') || t.includes('general')) {
    return 'theoretical';
  }
  if (t.includes('program') || t.includes('computa')) {
    return 'programming';
  }
  if (t.includes('electron')) {
    return 'electronics';
  }
  if (t.includes('enferm')) {
    return 'nursing';
  }
  return 'theoretical';
};

const formatDocente = (d: any) => {
  if (!d) return null;
  const availability: Record<number, number[]> = {
    0: [], 1: [], 2: [], 3: [], 4: []
  };
  d.disponibilidad_docente?.forEach((dd: any) => {
    if (availability[dd.id_dia]) {
      availability[dd.id_dia].push(dd.id_bloque);
    }
  });
  return {
    id_docente: d.id_docente,
    dni_docente: d.dni_docente,
    nom_docente: d.nom_docente,
    ape_docente: d.ape_docente,
    nom_especialidad: d.nom_especialidad,
    disponibilidad: availability
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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
      const docente = formatDocente(s.docente);
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
    console.error("Error al obtener datos:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      await prisma.horario_sesion.deleteMany({ where: { id_usuario: userId } });
    } else {
      await prisma.horario_sesion.deleteMany();
    }
    return NextResponse.json({ message: 'Todos los horarios eliminados exitosamente' });
  } catch (error: any) {
    console.error('Error al limpiar horarios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
      const count = await prisma.$transaction(async (tx) => {
        const firstUserId = datos[0].userId;
        if (firstUserId) {
          await tx.horario_sesion.deleteMany({ where: { id_usuario: firstUserId } });
        } else {
          await tx.horario_sesion.deleteMany();
        }

        let creadosCount = 0;
        for (const sesion of datos) {
          const { courseId, teacherId, roomId, sessionType, day, slot, userId } = sesion;

          if (courseId && roomId && teacherId && day !== undefined && slot !== undefined) {
            // Asegurar que exista la asignacion en periodo Actual
            let asg = await tx.asignacion.findFirst({
              where: {
                id_curso: courseId,
                id_periodo: 'Actual',
              }
            });

            if (!asg) {
              asg = await tx.asignacion.create({
                data: {
                  id_asignacion: `${courseId}-Actual`,
                  id_docente: teacherId,
                  id_curso: courseId,
                  id_periodo: 'Actual',
                }
              });
            } else if (asg.id_docente !== teacherId) {
              // Si cambió el docente, actualizamos la asignación
              asg = await tx.asignacion.update({
                where: { id_asignacion: asg.id_asignacion },
                data: { id_docente: teacherId }
              });
            }

            // Validar capacidad del aula vs alumnos del curso
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
                id_periodo: 'Actual',
                id_aula: roomId,
                id_dia: day,
                id_bloque: slot,
                tipo_sesion: sessionType || 'theoretical',
                id_usuario: userId,
              }
            });
            creadosCount++;
          }
        }
        return creadosCount;
      });

      return NextResponse.json({ message: 'Horario generado guardado exitosamente', count });
    }

    // SI NO, se asume que es la lógica original de Importación de Excel (adaptada al nuevo schema)
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

    // Pre-requisito: asegurar entidades base antes de importar
    await prisma.facultad.upsert({
      where: { id_facultad: 'F01' },
      update: {},
      create: { id_facultad: 'F01', nom_facultad: 'General' },
    });

    await prisma.carrera.upsert({
      where: { id_carrera: 'C01' },
      update: {},
      create: { id_carrera: 'C01', nom_carrera: 'General', id_facultad: 'F01' },
    });

    await prisma.ciclo.upsert({
      where: { id_ciclo: 1 },
      update: {},
      create: { id_ciclo: 1, nom_ciclo: '1' },
    });

    await prisma.tipo_aula.upsert({
      where: { id_tipo_aula: 'T1' },
      update: {},
      create: { id_tipo_aula: 'T1', nom_tipo_aula: 'General' },
    });

    await prisma.periodo_academico.upsert({
      where: { id_periodo: 'Actual' },
      update: {},
      create: { id_periodo: 'Actual', nom_periodo: 'Periodo Actual', activo: true }
    });

    // Limpiar horarios anteriores para evitar conflictos en la nueva importación
    const firstUserId = datos[0]?.userId;
    if (firstUserId) {
      await prisma.horario_sesion.deleteMany({ where: { id_usuario: firstUserId } });
    } else {
      await prisma.horario_sesion.deleteMany();
    }

    for (const [index, filaRaw] of datos.entries()) {
      const fila = normalizeRow(filaRaw);
      const userId = filaRaw.userId;
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
          id_carrera: 'C01',
          modalidad: 'Presencial',
          tipo_curso: 'theoretical',
          id_ciclo: 1,
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
          id_tipo_aula: 'T1',
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
            id_periodo: 'Actual',
          }
        }
      });

      if (!asg) {
        asg = await prisma.asignacion.create({
          data: {
            id_asignacion: `${idCurso}-Actual`,
            id_docente: idDocente,
            id_curso: idCurso,
            id_periodo: 'Actual',
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
          id_periodo: 'Actual',
          id_aula: idAula,
          id_dia: id_dia,
          id_bloque: id_bloque,
          tipo_sesion: 'theoretical',
          id_usuario: userId,
        },
      });
    }

    return NextResponse.json({ message: 'Importado con éxito' });
  } catch (error: any) {
    console.error('Error al importar:', error);
    if (error.message === 'El aula seleccionada no tiene capacidad suficiente para el número de alumnos de este curso.') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}