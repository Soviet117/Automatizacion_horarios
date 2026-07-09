import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, handleApiError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const aulas = await prisma.aula.findMany({
      where: userId ? { id_usuario: userId } : {},
      include: {
        tipo_aula: true
      },
      orderBy: { nom_aula: 'asc' },
    });
    return NextResponse.json(aulas);
  } catch (error) {
    return handleApiError(error, 'GET aulas');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json()

    const id_aula = body.id || body.id_aula
    const nom_aula = body.name || body.nom_aula
    const id_tipo_aula = body.type || body.id_tipo_aula
    const capacidad = body.capacity !== undefined ? Number(body.capacity) : (body.capacidad !== undefined ? Number(body.capacidad) : 1)

    if (!id_aula || !nom_aula || !id_tipo_aula) {
      return NextResponse.json(
        { error: 'El ID, Nombre y Tipo de aula son requeridos' },
        { status: 400 }
      )
    }

    await prisma.tipo_aula.upsert({
      where: { id_tipo_aula },
      update: {},
      create: { id_tipo_aula, nom_tipo_aula: id_tipo_aula }
    });

    const aula = await prisma.aula.create({
      data: {
        id_aula,
        nom_aula,
        id_tipo_aula,
        capacidad,
        id_usuario: session.userId,
      },
    })

    return NextResponse.json({ 
      message: 'Aula registrada exitosamente', 
      data: aula 
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un aula con este ID' }, { status: 400 });
    }
    return handleApiError(error, 'POST aulas');
  }
}
