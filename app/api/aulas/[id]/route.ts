import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, handleApiError } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params
    const body = await request.json()

    const nom_aula = body.name || body.nom_aula
    const id_tipo_aula = body.type !== undefined ? body.type : body.id_tipo_aula
    const capacidad = body.capacity !== undefined ? Number(body.capacity) : (body.capacidad !== undefined ? Number(body.capacidad) : undefined)

    if (nom_aula === '') {
      return NextResponse.json({ error: 'El nombre del aula es requerido' }, { status: 400 })
    }

    if (id_tipo_aula) {
      await prisma.tipo_aula.upsert({
        where: { id_tipo_aula },
        update: {},
        create: { id_tipo_aula, nom_tipo_aula: id_tipo_aula }
      });
    }

    const aula = await prisma.aula.update({
      where: { id_aula: id },
      data: { nom_aula, id_tipo_aula, capacidad },
    })

    return NextResponse.json({ message: 'Aula actualizada exitosamente', data: aula })
  } catch (error) {
    return handleApiError(error, 'PUT aulas/[id]');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params

    await prisma.horario_sesion.deleteMany({ where: { id_aula: id } })
    await prisma.aula.delete({ where: { id_aula: id } })

    return NextResponse.json({ message: 'Aula eliminada exitosamente' })
  } catch (error) {
    return handleApiError(error, 'DELETE aulas/[id]');
  }
}
