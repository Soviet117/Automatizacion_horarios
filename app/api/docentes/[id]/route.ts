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
    
    const fullName = body.name || body.nom_docente || ''
    const parts = fullName.trim().split(/\s+/)
    const nom_docente = body.nom_docente || parts[0] || undefined
    const ape_docente = body.ape_docente || (parts.length > 1 ? parts.slice(1).join(' ') : undefined)
    const dni_docente = body.dni_docente !== undefined ? body.dni_docente : undefined
    const nom_especialidad = body.nom_especialidad !== undefined ? body.nom_especialidad : undefined
    const disponibilidad = body.availability !== undefined ? body.availability : body.disponibilidad

    if (nom_docente === '') {
      return NextResponse.json({ error: 'El nombre del docente es requerido' }, { status: 400 })
    }

    const docente = await prisma.$transaction(async (tx) => {
      const d = await tx.docente.update({
        where: { id_docente: id },
        data: { dni_docente, nom_docente, ape_docente, nom_especialidad },
      });

      if (disponibilidad !== undefined) {
        await tx.disponibilidad_docente.deleteMany({ where: { id_docente: id } });

        if (disponibilidad && typeof disponibilidad === 'object') {
          const records = [];
          for (const [diaStr, bloques] of Object.entries(disponibilidad)) {
            const dia = parseInt(diaStr);
            if (!isNaN(dia) && Array.isArray(bloques)) {
              for (const bloque of bloques) {
                records.push({
                  id_disponibilidad: `${id}-${dia}-${bloque}`,
                  id_docente: id, id_dia: dia, id_bloque: bloque,
                });
              }
            }
          }
          if (records.length > 0) {
            await tx.disponibilidad_docente.createMany({ data: records });
          }
        }
      }
      return d;
    });

    return NextResponse.json({
      message: 'Docente actualizado exitosamente',
      data: { ...docente, disponibilidad }
    })
  } catch (error) {
    return handleApiError(error, 'PUT docentes/[id]');
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
    await prisma.docente.delete({ where: { id_docente: id } })

    return NextResponse.json({ message: 'Docente eliminado exitosamente' })
  } catch (error) {
    return handleApiError(error, 'DELETE docentes/[id]');
  }
}
