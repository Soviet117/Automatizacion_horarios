import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, handleApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const { searchParams } = new URL(request.url);
    const id_curso = searchParams.get('id_curso');

    const userFilter = userId ? { id_usuario: userId } : {};

    const periodo = await prisma.periodo_academico.findFirst({
      where: { activo: true, ...userFilter }
    });
    if (!periodo) {
      return NextResponse.json({ error: 'No hay periodo activo' }, { status: 400 });
    }

    const whereClause: Record<string, unknown> = { id_periodo: periodo.id_periodo };
    if (id_curso) whereClause.id_curso = id_curso;

    const asignaciones = await prisma.asignacion.findMany({
      where: whereClause,
      include: { docente: true, curso: true }
    });

    return NextResponse.json(asignaciones);
  } catch (error) {
    return handleApiError(error, 'GET asignaciones');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id_curso, id_docente } = body;

    if (!id_curso || !id_docente) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const periodo = await prisma.periodo_academico.findFirst({
      where: { activo: true, id_usuario: session.userId }
    });
    if (!periodo) {
      return NextResponse.json({ error: 'No hay periodo activo' }, { status: 400 });
    }

    const existing = await prisma.asignacion.findFirst({
      where: { id_curso, id_docente, id_periodo: periodo.id_periodo }
    });

    if (existing) {
      return NextResponse.json({ error: 'El docente ya está asignado a este curso en el periodo actual' }, { status: 400 });
    }

    const competency = await prisma.competencia_docente.findFirst({
      where: { id_docente, id_curso }
    });

    if (!competency) {
      return NextResponse.json({ error: 'El docente no tiene la competencia requerida para este curso' }, { status: 400 });
    }

    const asignacion = await prisma.asignacion.create({
      data: {
        id_asignacion: `ASG-${crypto.randomUUID().substring(0, 8)}`,
        id_curso, id_docente,
        id_periodo: periodo.id_periodo,
        id_usuario: session.userId,
      },
      include: { docente: true }
    });

    return NextResponse.json(asignacion);
  } catch (error) {
    return handleApiError(error, 'POST asignaciones');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const existing = await prisma.asignacion.findFirst({
      where: { id_asignacion: id, id_usuario: session.userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Asignación no encontrada o sin permisos' }, { status: 404 });
    }

    await prisma.asignacion.delete({ where: { id_asignacion: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE asignaciones');
  }
}
