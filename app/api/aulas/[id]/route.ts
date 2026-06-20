import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Soporte para formato de frontend e interno
    const nom_aula = body.name || body.nom_aula
    const id_tipo_aula = body.type !== undefined ? body.type : body.id_tipo_aula
    const capacidad = body.capacity !== undefined ? Number(body.capacity) : (body.capacidad !== undefined ? Number(body.capacidad) : undefined)

    if (nom_aula === '') {
      return NextResponse.json(
        { error: 'El nombre del aula es requerido' },
        { status: 400 }
      )
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
      data: {
        nom_aula,
        id_tipo_aula,
        capacidad,
      },
    })

    return NextResponse.json({
      message: 'Aula actualizada exitosamente',
      data: aula
    })
  } catch (error: any) {
    console.error('Error al actualizar aula:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el aula' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Eliminar horarios asociados primero
    await prisma.horario_sesion.deleteMany({
      where: { id_aula: id }
    })

    // Eliminar aula
    await prisma.aula.delete({
      where: { id_aula: id },
    })

    return NextResponse.json({
      message: 'Aula eliminada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar aula:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el aula' },
      { status: 500 }
    )
  }
}
