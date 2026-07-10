import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, handleApiError } from '@/lib/auth'
import { sanitizeTipoCurso, mapProgramToCarreraId } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.curso.findFirst({
      where: { id_curso: id, id_usuario: session.userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Curso no encontrado o sin permisos' }, { status: 404 });
    }

    const nom_curso = body.name || body.nom_curso
    const tipo_curso = body.type !== undefined ? body.type : body.tipo_curso
    const creditos = body.creditos !== undefined ? Number(body.creditos) : undefined
    const modalidad = body.modalidad !== undefined ? body.modalidad : undefined
    const id_ciclo = body.semester !== undefined ? Number(body.semester) : (body.id_ciclo !== undefined ? Number(body.id_ciclo) : undefined)
    const horas_teoricas = body.theoreticalHours !== undefined ? Number(body.theoreticalHours) : undefined
    const horas_practicas = body.practicalHours !== undefined ? Number(body.practicalHours) : undefined
    const alumnos = body.students !== undefined ? Number(body.students) : undefined
    const id_docente = body.teacherId !== undefined ? body.teacherId : body.id_docente
    const id_carrera = body.id_carrera || (body.program !== undefined ? mapProgramToCarreraId(body.program) : undefined)

    if (nom_curso === '') {
      return NextResponse.json({ error: 'El nombre del curso es requerido' }, { status: 400 })
    }

    const curso = await prisma.$transaction(async (tx) => {
      const sanitizedTipoCurso = tipo_curso !== undefined ? sanitizeTipoCurso(tipo_curso) : undefined;
      const c = await tx.curso.update({
        where: { id_curso: id },
        data: {
          creditos, nom_curso, id_carrera, modalidad,
          tipo_curso: sanitizedTipoCurso, id_ciclo,
          horas_teoricas, horas_practicas, alumnos,
          id_plan: body.id_plan !== undefined ? body.id_plan : undefined,
        },
      });

      if (id_docente !== undefined) {
        const periodo = await prisma.periodo_academico.findFirst({
          where: { activo: true, id_usuario: session.userId }
        });
        const idPeriodoActivo = periodo?.id_periodo;

        await tx.asignacion.deleteMany({ where: { id_curso: id, id_periodo: idPeriodoActivo ?? undefined } });

        if (id_docente) {
          await tx.asignacion.create({
            data: {
              id_asignacion: `${id}-${idPeriodoActivo}`,
              id_docente, id_curso: id, id_periodo: idPeriodoActivo!,
              id_usuario: session.userId,
            }
          });
        }
      }

      return c;
    });

    return NextResponse.json({
      message: 'Curso actualizado exitosamente',
      data: { ...curso, id_docente: id_docente !== undefined ? (id_docente || null) : undefined }
    })
  } catch (error) {
    return handleApiError(error, 'PUT cursos/[id]');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params

    const existing = await prisma.curso.findFirst({
      where: { id_curso: id, id_usuario: session.userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Curso no encontrado o sin permisos' }, { status: 404 });
    }

    await prisma.asignacion.deleteMany({ where: { id_curso: id } })
    await prisma.curso.delete({ where: { id_curso: id } })

    return NextResponse.json({ message: 'Curso eliminado exitosamente' })
  } catch (error) {
    return handleApiError(error, 'DELETE cursos/[id]');
  }
}
