import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ cursos: [], docentes: [], aulas: [] });
    }

    const userFilter = userId ? { id_usuario: userId } : {};

    const [cursos, docentes, aulas] = await Promise.all([
      prisma.curso.findMany({
        where: {
          OR: [
            { nom_curso: { contains: q, mode: 'insensitive' } },
            { id_curso: { contains: q, mode: 'insensitive' } },
          ],
          ...userFilter,
        },
        include: { carrera: { select: { nom_carrera: true } } },
        take: 5,
        orderBy: { nom_curso: 'asc' },
      }),
      prisma.docente.findMany({
        where: {
          OR: [
            { nom_docente: { contains: q, mode: 'insensitive' } },
            { ape_docente: { contains: q, mode: 'insensitive' } },
            { dni_docente: { contains: q, mode: 'insensitive' } },
          ],
          ...userFilter,
        },
        take: 5,
        orderBy: { ape_docente: 'asc' },
      }),
      prisma.aula.findMany({
        where: {
          OR: [
            { nom_aula: { contains: q, mode: 'insensitive' } },
            { id_aula: { contains: q, mode: 'insensitive' } },
          ],
          ...userFilter,
        },
        include: { tipo_aula: { select: { nom_tipo_aula: true } } },
        take: 5,
        orderBy: { nom_aula: 'asc' },
      }),
    ]);

    return NextResponse.json({ cursos, docentes, aulas });
  } catch (error) {
    console.error('Error en GET /api/buscar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
