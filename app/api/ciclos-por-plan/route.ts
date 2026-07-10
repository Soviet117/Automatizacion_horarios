import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const { searchParams } = new URL(request.url);
    const id_plan = searchParams.get('id_plan');

    if (!id_plan) {
      return NextResponse.json(
        { error: 'id_plan is required' },
        { status: 400 }
      );
    }

    const userFilter = userId ? { id_usuario: userId } : {};

    const ciclos = await prisma.curso.findMany({
      where: { id_plan, ...userFilter },
      select: { id_ciclo: true },
      distinct: ['id_ciclo'],
      orderBy: { id_ciclo: 'asc' }
    });

    const ciclosData = await prisma.ciclo.findMany({
      where: { id_ciclo: { in: ciclos.map(c => c.id_ciclo) }, ...userFilter },
      select: { id_ciclo: true, nom_ciclo: true },
      orderBy: { id_ciclo: 'asc' }
    });

    return NextResponse.json(ciclosData);
  } catch (error) {
    console.error('Error fetching ciclos por plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ciclos' },
      { status: 500 }
    );
  }
}
