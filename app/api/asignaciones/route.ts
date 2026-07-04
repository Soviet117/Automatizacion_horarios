import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_curso = searchParams.get('id_curso');

    const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
    if (!periodo) {
      return NextResponse.json({ error: 'No hay periodo activo' }, { status: 400 });
    }

    const whereClause: any = { id_periodo: periodo.id_periodo };
    if (id_curso) whereClause.id_curso = id_curso;

    const asignaciones = await prisma.asignacion.findMany({
      where: whereClause,
      include: {
        docente: true,
        curso: true
      }
    });

    return NextResponse.json(asignaciones);
  } catch (error) {
    console.error('Error GET asignaciones:', error);
    return NextResponse.json({ error: 'Error al obtener asignaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_curso, id_docente } = body;

    if (!id_curso || !id_docente) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const periodo = await prisma.periodo_academico.findFirst({ where: { activo: true } });
    if (!periodo) {
      return NextResponse.json({ error: 'No hay periodo activo' }, { status: 400 });
    }

    // Check if assignment already exists
    const existing = await prisma.asignacion.findFirst({
      where: {
        id_curso,
        id_docente,
        id_periodo: periodo.id_periodo
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'El docente ya está asignado a este curso en el periodo actual' }, { status: 400 });
    }

    // Check teacher has competency for this course
    const competency = await prisma.competencia_docente.findFirst({
      where: { id_docente, id_curso }
    });

    if (!competency) {
      return NextResponse.json({ error: 'El docente no tiene la competencia requerida para este curso' }, { status: 400 });
    }

    const asignacion = await prisma.asignacion.create({
      data: {
        id_asignacion: `ASG-${crypto.randomUUID().substring(0, 8)}`,
        id_curso,
        id_docente,
        id_periodo: periodo.id_periodo
      },
      include: {
        docente: true
      }
    });

    return NextResponse.json(asignacion);
  } catch (error) {
    console.error('Error POST asignacion:', error);
    return NextResponse.json({ error: 'Error al crear asignación' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await prisma.asignacion.delete({
      where: { id_asignacion: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE asignacion:', error);
    return NextResponse.json({ error: 'Error al eliminar asignación' }, { status: 500 });
  }
}
