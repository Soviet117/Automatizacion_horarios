import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password, name } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const existingUser = await prisma.usuario.findUnique({
      where: { email: username }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.usuario.create({
      data: {
        email: username,
        password: hashedPassword,
        nombre: name,
        role: 'user'
      }
    });

    return NextResponse.json({
      id: newUser.id_usuario,
      username: newUser.email,
      name: newUser.nombre,
      role: newUser.role
    }, { status: 201 });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
