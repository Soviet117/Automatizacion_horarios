import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, handleApiError } from '@/lib/auth';
import { ensureDefaults } from '@/lib/ensureDefaults';

export async function GET(request: NextRequest) {
  try {
    await ensureDefaults(prisma);
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
