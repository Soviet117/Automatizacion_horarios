import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_MODALIDAD } from '@/lib/constants';
import { getSessionFromRequest, handleApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const userFilter = userId ? { OR: [{ id_usuario: null }, { id_usuario: userId }] } : {};

    const cursos = await prisma.curso.findMany({
      where: userFilter,
      include: {
        carrera: true,
        ciclo: true,
        tipo_sesion: true,
        plan: true
      },
      orderBy: {
        nom_curso: 'asc'
      }
    });
    return NextResponse.json(cursos);
  } catch (error) {
    return handleApiError(error, 'GET gestion-curricular');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const data = await request.json();

    if (!data.id_curso || !data.nom_curso || !data.id_carrera || data.id_ciclo === undefined || !data.tipo_curso) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newCurso = await prisma.curso.create({
      data: {
        id_curso: data.id_curso,
        nom_curso: data.nom_curso,
        creditos: parseInt(data.creditos) || 0,
        id_carrera: data.id_carrera,
        modalidad: data.modalidad || DEFAULT_MODALIDAD,
        tipo_curso: data.tipo_curso,
        id_ciclo: parseInt(data.id_ciclo),
        horas_teoricas: parseInt(data.horas_teoricas) || 0,
        horas_practicas: parseInt(data.horas_practicas) || 0,
        alumnos: parseInt(data.alumnos) || 0,
        id_plan: data.id_plan || null,
        id_usuario: session.userId,
      }
    });

    return NextResponse.json(newCurso, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json({ error: 'El ID del curso ya existe.' }, { status: 409 });
    }
    return handleApiError(error, 'POST gestion-curricular');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const data = await request.json();

    if (!data.id_curso) {
      return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
    }

    const existing = await prisma.curso.findFirst({
      where: { id_curso: data.id_curso, id_usuario: session.userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Curso no encontrado o sin permisos' }, { status: 404 });
    }

    const updatedCurso = await prisma.curso.update({
      where: { id_curso: data.id_curso },
      data: {
        nom_curso: data.nom_curso,
        creditos: parseInt(data.creditos),
        id_carrera: data.id_carrera,
        modalidad: data.modalidad,
        tipo_curso: data.tipo_curso,
        id_ciclo: parseInt(data.id_ciclo),
        horas_teoricas: parseInt(data.horas_teoricas),
        horas_practicas: parseInt(data.horas_practicas),
        alumnos: parseInt(data.alumnos),
        id_plan: data.id_plan || null,
      }
    });

    return NextResponse.json(updatedCurso);
  } catch (error) {
    return handleApiError(error, 'PUT gestion-curricular');
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
      return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
    }

    const existing = await prisma.curso.findFirst({
      where: { id_curso: id, id_usuario: session.userId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Curso no encontrado o sin permisos' }, { status: 404 });
    }

    await prisma.curso.delete({
      where: { id_curso: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE gestion-curricular');
  }
}
