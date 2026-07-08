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
      select: {
        id_usuario: true,
        email: true,
        nombre: true,
        role: true,
        telefono: true,
        departamento: true,
        avatar_url: true,
        preferencias: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      telefono: user.telefono,
      departamento: user.departamento,
      avatar_url: user.avatar_url,
      preferencias: user.preferencias,
    });
  } catch (error) {
    console.error('Error en GET /api/auth/profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, nombre, email, telefono, departamento, avatar_url } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    const existing = await prisma.usuario.findUnique({ where: { id_usuario: userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (email && email !== existing.email) {
      const emailTaken = await prisma.usuario.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
      }
    }

    const updated = await prisma.usuario.update({
      where: { id_usuario: userId },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(email !== undefined && { email }),
        ...(telefono !== undefined && { telefono }),
        ...(departamento !== undefined && { departamento }),
        ...(avatar_url !== undefined && { avatar_url }),
      },
      select: {
        id_usuario: true,
        email: true,
        nombre: true,
        role: true,
        telefono: true,
        departamento: true,
        avatar_url: true,
        preferencias: true,
      },
    });

    return NextResponse.json({
      id: updated.id_usuario,
      email: updated.email,
      nombre: updated.nombre,
      role: updated.role,
      telefono: updated.telefono,
      departamento: updated.departamento,
      avatar_url: updated.avatar_url,
      preferencias: updated.preferencias,
    });
  } catch (error) {
    console.error('Error en PUT /api/auth/profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
