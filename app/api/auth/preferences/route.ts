import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      select: { preferencias: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ preferencias: user.preferencias || {} });
  } catch (error) {
    console.error('Error en GET /api/auth/preferences:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, preferencias } = await request.json();

    if (!userId || !preferencias) {
      return NextResponse.json({ error: 'userId y preferencias son requeridos' }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({ where: { id_usuario: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const currentPrefs = (user.preferencias as Record<string, unknown>) || {};
    const merged = {
      ...currentPrefs,
      ...preferencias,
      notificaciones: preferencias.notificaciones !== undefined
        ? { ...(currentPrefs.notificaciones as Record<string, unknown> || {}), ...preferencias.notificaciones }
        : currentPrefs.notificaciones,
      apariencia: preferencias.apariencia !== undefined
        ? { ...(currentPrefs.apariencia as Record<string, unknown> || {}), ...preferencias.apariencia }
        : currentPrefs.apariencia,
    };

    await prisma.usuario.update({
      where: { id_usuario: userId },
      data: { preferencias: merged },
    });

    return NextResponse.json({ message: 'Preferencias actualizadas exitosamente', preferencias: merged });
  } catch (error) {
    console.error('Error en PUT /api/auth/preferences:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
