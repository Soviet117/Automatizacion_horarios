import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, handleApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

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
    return handleApiError(error, 'GET escenarios');
  }
}
