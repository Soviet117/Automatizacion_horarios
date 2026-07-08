import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    console.error('Error en GET /api/configuracion/csp:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      dias_por_semana,
      bloques_por_dia,
      horas_max_por_profesor,
      timeout_segundos,
      modo_relajado,
      sesiones_max_por_dia_profesor,
    } = body;

    await prisma.configuracion_csp.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        dias_por_semana: dias_por_semana ?? 5,
        bloques_por_dia: bloques_por_dia ?? 8,
        horas_max_por_profesor: horas_max_por_profesor ?? 40,
        timeout_segundos: timeout_segundos ?? 60,
        modo_relajado: modo_relajado ?? false,
        sesiones_max_por_dia_profesor: sesiones_max_por_dia_profesor ?? 1,
      },
      update: {
        ...(dias_por_semana !== undefined && { dias_por_semana }),
        ...(bloques_por_dia !== undefined && { bloques_por_dia }),
        ...(horas_max_por_profesor !== undefined && { horas_max_por_profesor }),
        ...(timeout_segundos !== undefined && { timeout_segundos }),
        ...(modo_relajado !== undefined && { modo_relajado }),
        ...(sesiones_max_por_dia_profesor !== undefined && { sesiones_max_por_dia_profesor }),
      },
    });

    const config = await prisma.configuracion_csp.findUnique({
      where: { id: 'global' }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error en PUT /api/configuracion/csp:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
