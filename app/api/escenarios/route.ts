import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where = userId ? { creado_por: userId } : {};

    const escenarios = await prisma.escenario.findMany({
      where,
      orderBy: [
        { estado: 'asc' },
        { creado_el: 'desc' },
      ],
      select: {
        id_escenario: true,
        nom_escenario: true,
        estado: true,
        cobertura: true,
        conflictos: true,
        creado_el: true,
        creado_por: true,
        ciclo: { select: { nom_ciclo: true } },
        plan: { select: { nom_plan: true } },
      },
    });

    return NextResponse.json(escenarios);
  } catch (error) {
    console.error('Error en GET /api/escenarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
