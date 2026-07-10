import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const notificaciones = await prisma.notificacion.findMany({
      where: { id_usuario: session.userId },
      orderBy: { creado_el: 'desc' },
      take: 20,
    });

    return NextResponse.json(notificaciones.map(n => ({
      id: n.id_notificacion,
      userId: n.id_usuario,
      tipo: n.tipo,
      mensaje: n.mensaje,
      leida: n.leida,
      link: n.link,
      creadoEl: n.creado_el.toISOString(),
    })));
  } catch (error) {
    console.error('Error en GET /api/notificaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { tipo, mensaje, link } = await request.json();

    if (!tipo || !mensaje) {
      return NextResponse.json({ error: 'tipo y mensaje son requeridos' }, { status: 400 });
    }

    const notificacion = await prisma.notificacion.create({
      data: {
        id_usuario: session.userId,
        tipo,
        mensaje,
        link: link || null,
      },
    });

    return NextResponse.json({
      id: notificacion.id_notificacion,
      tipo: notificacion.tipo,
      mensaje: notificacion.mensaje,
      leida: notificacion.leida,
      link: notificacion.link,
      creadoEl: notificacion.creado_el.toISOString(),
    });
  } catch (error) {
    console.error('Error en POST /api/notificaciones:', error);
    return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 });
  }
}
