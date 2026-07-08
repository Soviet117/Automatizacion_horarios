import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const body = await request.json();
    const { leida } = body;

    await prisma.notificacion.update({
      where: { id_notificacion: id },
      data: { leida: leida ?? true },
    });

    return NextResponse.json({ message: 'Actualizado' });
  } catch (error) {
    console.error('Error en PATCH /api/notificaciones/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
