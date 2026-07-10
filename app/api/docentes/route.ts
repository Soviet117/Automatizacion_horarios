import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, handleApiError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session?.userId;

    const userFilter = userId
      ? { OR: [{ id_usuario: null }, { id_usuario: userId }] }
      : {};

    const docentes = await prisma.docente.findMany({
      where: userFilter,
      include: {
        disponibilidad_docente: true,
        competencia_docente: true,
      },
      orderBy: { nom_docente: 'asc' },
    });

    const formattedDocentes = docentes.map(d => {
      const availability: Record<number, number[]> = {
        0: [], 1: [], 2: [], 3: [], 4: []
      };
      d.disponibilidad_docente.forEach(dd => {
        if (availability[dd.id_dia]) {
          availability[dd.id_dia].push(dd.id_bloque);
        }
      });
      return {
        id_docente: d.id_docente,
        dni_docente: d.dni_docente,
        nom_docente: d.nom_docente,
        ape_docente: d.ape_docente,
        nom_especialidad: d.nom_especialidad,
        disponibilidad: availability,
        competencias: d.competencia_docente.map((c: any) => c.id_curso)
      };
    });

    return NextResponse.json(formattedDocentes);
  } catch (error) {
    return handleApiError(error, 'GET docentes');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json()

    const id_docente = body.id || body.id_docente
    const fullName = body.name || body.nom_docente || ''
    const parts = fullName.trim().split(/\s+/)
    const nom_docente = body.nom_docente || parts[0] || 'Docente'
    const ape_docente = body.ape_docente || parts.slice(1).join(' ') || 'Desconocido'
    const dni_docente = body.dni_docente || '00000000'
    const nom_especialidad = body.nom_especialidad || 'General'
    const disponibilidad = body.availability !== undefined ? body.availability : body.disponibilidad

    if (!id_docente || !nom_docente) {
      return NextResponse.json({ error: 'El ID y el Nombre son requeridos' }, { status: 400 })
    }

    const docente = await prisma.$transaction(async (tx) => {
      const d = await tx.docente.create({
        data: {
          id_docente,
          dni_docente,
          nom_docente,
          ape_docente,
          nom_especialidad,
          id_usuario: session.userId,
        },
      });

      if (disponibilidad && typeof disponibilidad === 'object') {
        const records = [];
        for (const [diaStr, bloques] of Object.entries(disponibilidad)) {
          const dia = parseInt(diaStr);
          if (!isNaN(dia) && Array.isArray(bloques)) {
            for (const bloque of bloques) {
              records.push({
                id_disponibilidad: `${id_docente}-${dia}-${bloque}`,
                id_docente,
                id_dia: dia,
                id_bloque: bloque,
              });
            }
          }
        }
        if (records.length > 0) {
          await tx.disponibilidad_docente.createMany({ data: records });
        }
      }

      return d;
    });

    return NextResponse.json({ 
      message: 'Docente registrado exitosamente', 
      data: { ...docente, disponibilidad }
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un docente con este ID o DNI' }, { status: 400 });
    }
    return handleApiError(error, 'POST docentes');
  }
}
