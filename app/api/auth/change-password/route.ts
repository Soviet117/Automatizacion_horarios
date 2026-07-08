import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({ where: { id_usuario: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.usuario.update({
      where: { id_usuario: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en PUT /api/auth/change-password:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
