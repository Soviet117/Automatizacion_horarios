import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'email es requerido' }, { status: 400 });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.verificacion_pendiente.upsert({
      where: { email },
      update: { codigo: code, expiracion: expiresAt },
      create: { email, codigo: code, expiracion: expiresAt },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({ message: 'Código enviado al correo' });
  } catch (error) {
    console.error('Error en send-verification:', error);
    return NextResponse.json({ error: 'Error al enviar el código de verificación' }, { status: 500 });
  }
}
