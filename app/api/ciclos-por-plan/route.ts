import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_plan = searchParams.get('id_plan');

    if (!id_plan) {
      return NextResponse.json(
        { error: 'id_plan is required' },
        { status: 400 }
      );
    }

    const ciclos = await prisma.curso.findMany({
      where: { id_plan },
      select: { id_ciclo: true },
      distinct: ['id_ciclo'],
      orderBy: { id_ciclo: 'asc' }
    });

    const ciclosData = await prisma.ciclo.findMany({
      where: { id_ciclo: { in: ciclos.map(c => c.id_ciclo) } },
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
  } finally {
    await prisma.$disconnect();
  }
}
