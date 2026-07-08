import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    const notificaciones = await prisma.notificacion.findMany({
      where: { id_usuario: userId },
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

export async function POST(request: Request) {
  try {
    const { userId, tipo, mensaje, link } = await request.json();

    if (!userId || !tipo || !mensaje) {
      return NextResponse.json({ error: 'userId, tipo y mensaje son requeridos' }, { status: 400 });
    }

    const notificacion = await prisma.notificacion.create({
      data: {
        id_usuario: userId,
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
