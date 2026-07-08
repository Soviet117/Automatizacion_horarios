import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, handleApiError } from '@/lib/auth';

export async function GET() {
  try {
    let config = await prisma.configuracion_csp.findUnique({
      where: { id: 'global' }
    });

    if (!config) {
      config = await prisma.configuracion_csp.create({
        data: { id: 'global' }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error, 'GET configuracion/csp');
  }
}

function validateInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function validateBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
    }

    const data = {
      dias_por_semana: validateInt(body.dias_por_semana, 5),
      bloques_por_dia: validateInt(body.bloques_por_dia, 8),
      horas_max_por_profesor: validateInt(body.horas_max_por_profesor, 40),
      timeout_segundos: validateInt(body.timeout_segundos, 60),
      modo_relajado: validateBool(body.modo_relajado, false),
      sesiones_max_por_dia_profesor: validateInt(body.sesiones_max_por_dia_profesor, 1),
    };

    await prisma.configuracion_csp.upsert({
      where: { id: 'global' },
      create: { id: 'global', ...data },
      update: data,
    });

    const config = await prisma.configuracion_csp.findUnique({
      where: { id: 'global' }
    });

    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error, 'PUT configuracion/csp');
  }
}
