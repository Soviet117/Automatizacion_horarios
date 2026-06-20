import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const aulas = await prisma.aula.findMany({
      where: userId ? { id_usuario: userId } : {},
      include: {
        tipo_aula: true
      },
      orderBy: { nom_aula: 'asc' },
    });
    return NextResponse.json(aulas);
  } catch (error) {
    console.error('Error fetching aulas:', error);
    return NextResponse.json(
      { error: 'Error al obtener aulas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Soporte para formato de frontend e interno
    const id_aula = body.id || body.id_aula
    const nom_aula = body.name || body.nom_aula
    const id_tipo_aula = body.type || body.id_tipo_aula
    const capacidad = body.capacity !== undefined ? Number(body.capacity) : (body.capacidad !== undefined ? Number(body.capacidad) : 1)
    const id_usuario = body.userId

    if (!id_aula || !nom_aula || !id_tipo_aula) {
      return NextResponse.json(
        { error: 'El ID, Nombre y Tipo de aula son requeridos' },
        { status: 400 }
      )
    }

    // Asegurar que el tipo de aula existe en la base de datos
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
        id_usuario,
      },
    })

    return NextResponse.json({ 
      message: 'Aula registrada exitosamente', 
      data: aula 
    })
  } catch (error: any) {
    console.error('Error al registrar aula:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un aula con este ID' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
