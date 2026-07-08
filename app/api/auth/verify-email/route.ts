import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'email y código son requeridos' }, { status: 400 });
    }

    const pendiente = await prisma.verificacion_pendiente.findUnique({ where: { email } });
    if (!pendiente) {
      return NextResponse.json({ error: 'No hay código pendiente. Solicita uno nuevo.' }, { status: 400 });
    }

    if (pendiente.codigo !== code) {
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 });
    }

    if (new Date() > pendiente.expiracion) {
      await prisma.verificacion_pendiente.delete({ where: { email } });
      return NextResponse.json({ error: 'El código ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    await prisma.verificacion_pendiente.delete({ where: { email } });

    return NextResponse.json({ message: 'Correo verificado exitosamente' });
  } catch (error) {
    console.error('Error en verify-email:', error);
    return NextResponse.json({ error: 'Error al verificar el código' }, { status: 500 });
  }
}
