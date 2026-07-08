import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_MODALIDAD } from '@/lib/constants'
import { getSessionFromRequest, handleApiError } from '@/lib/auth'
import { sanitizeTipoCurso, mapProgramToCarreraId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
    const idPeriodoActivo = periodo?.id_periodo;

    const cursos = await prisma.curso.findMany({
      where: userId ? { id_usuario: userId } : {},
      include: {
        carrera: true,
        ciclo: true,
        plan: true,
        asignacion: {
          where: { id_periodo: idPeriodoActivo ?? undefined },
          include: {
            docente: {
              include: { disponibilidad_docente: true }
            }
          }
        }
      },
      orderBy: { nom_curso: 'asc' },
    });

    const formattedCursos = cursos.map(c => {
      const mainAsg = c.asignacion[0];
      let formattedDocente = null;
      if (mainAsg?.docente) {
        const availability: Record<number, number[]> = {
          0: [], 1: [], 2: [], 3: [], 4: []
        };
        mainAsg.docente.disponibilidad_docente.forEach(dd => {
          if (availability[dd.id_dia]) {
            availability[dd.id_dia].push(dd.id_bloque);
          }
        });
        formattedDocente = {
          id_docente: mainAsg.docente.id_docente,
          dni_docente: mainAsg.docente.dni_docente,
          nom_docente: mainAsg.docente.nom_docente,
          ape_docente: mainAsg.docente.ape_docente,
          nom_especialidad: mainAsg.docente.nom_especialidad,
          disponibilidad: availability
        };
      }

      return {
        id_curso: c.id_curso,
        creditos: c.creditos,
        nom_curso: c.nom_curso,
        id_carrera: c.id_carrera,
        modalidad: c.modalidad,
        tipo_curso: c.tipo_curso,
        id_ciclo: c.id_ciclo,
        horas_teoricas: c.horas_teoricas,
        horas_practicas: c.horas_practicas,
        alumnos: c.alumnos,
        id_plan: c.id_plan,
        carrera: c.carrera,
        ciclo: c.ciclo,
        plan: c.plan,
        id_docente: formattedDocente?.id_docente || null,
        docente: formattedDocente,
      };
    });

    return NextResponse.json(formattedCursos);
  } catch (error) {
    return handleApiError(error, 'GET cursos');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json()

    const id_curso = body.id || body.id_curso
    const nom_curso = body.name || body.nom_curso
    const tipo_curso = body.type || body.tipo_curso
    const creditos = body.creditos !== undefined ? Number(body.creditos) : 1
    const modalidad = body.modalidad || DEFAULT_MODALIDAD
    const id_ciclo = body.semester !== undefined ? Number(body.semester) : (body.id_ciclo !== undefined ? Number(body.id_ciclo) : 1)
    const horas_teoricas = body.theoreticalHours !== undefined ? Number(body.theoreticalHours) : 0
    const horas_practicas = body.practicalHours !== undefined ? Number(body.practicalHours) : 0
    const alumnos = body.students !== undefined ? Number(body.students) : 0
    const id_docente = body.teacherId !== undefined ? body.teacherId : body.id_docente

    const id_carrera = body.id_carrera || mapProgramToCarreraId(body.program || '')

    if (!id_curso || !nom_curso || !id_carrera) {
      return NextResponse.json({ error: 'El ID, Nombre y Carrera son requeridos' }, { status: 400 })
    }

    const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
    const idPeriodoActivo = periodo?.id_periodo;
    if (!idPeriodoActivo) {
      return NextResponse.json({ error: 'No hay un periodo académico activo' }, { status: 400 });
    }

    const sanitizedTipoCurso = sanitizeTipoCurso(tipo_curso);

    const curso = await prisma.$transaction(async (tx) => {
      const c = await tx.curso.create({
        data: {
          id_curso,
          creditos,
          nom_curso,
          id_carrera,
          modalidad,
          tipo_curso: sanitizedTipoCurso,
          id_ciclo,
          horas_teoricas,
          horas_practicas,
          alumnos,
          id_plan: body.id_plan || 'PLAN_GEN',
          id_usuario: session.userId,
        },
      });

      if (id_docente) {
        await tx.asignacion.create({
          data: {
            id_asignacion: `${id_curso}-${idPeriodoActivo}`,
            id_docente,
            id_curso,
            id_periodo: idPeriodoActivo,
          }
        });
      }

      return c;
    });

    return NextResponse.json({ 
      message: 'Curso registrado exitosamente', 
      data: {
        ...curso,
        id_docente: id_docente || null
      }
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un curso con este ID' }, { status: 400 })
    }
    return handleApiError(error, 'POST cursos');
  }
}
