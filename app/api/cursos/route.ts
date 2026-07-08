import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_MODALIDAD } from '@/lib/constants'

const mapProgramToCarreraId = (program: string): string => {
  if (!program) return "C01";
  const norm = program.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("computa")) return "C02";
  if (norm.includes("electron")) return "C03";
  if (norm.includes("enferm")) return "C04";
  return "C01";
};

const sanitizeTipoCurso = (type: string): string => {
  const t = String(type ?? '').trim().toLowerCase();
  if (['theoretical', 'programming', 'electronics', 'nursing'].includes(t)) {
    return t;
  }
  if (t.includes('teoric') || t.includes('obligatorio') || t.includes('general')) {
    return 'theoretical';
  }
  if (t.includes('program') || t.includes('computa')) {
    return 'programming';
  }
  if (t.includes('electron')) {
    return 'electronics';
  }
  if (t.includes('enferm')) {
    return 'nursing';
  }
  return 'theoretical';
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const cursos = await prisma.curso.findMany({
      where: userId ? { id_usuario: userId } : {},
      include: {
        carrera: true,
        ciclo: true,
        plan: true,
        asignacion: {
          where: { id_periodo: 'Actual' },
          include: {
            docente: {
              include: {
                disponibilidad_docente: true
              }
            }
          }
        }
      },
      orderBy: { nom_curso: 'asc' },
    });

    const formattedCursos = cursos.map(c => {
      const mainAsg = c.asignacion[0];
      let formattedDocente = null;
      if (mainAsg?.docente) {
        const availability: Record<number, number[]> = {
          0: [], 1: [], 2: [], 3: [], 4: []
        };
        mainAsg.docente.disponibilidad_docente.forEach(dd => {
          if (availability[dd.id_dia]) {
            availability[dd.id_dia].push(dd.id_bloque);
          }
        });
        formattedDocente = {
          id_docente: mainAsg.docente.id_docente,
          dni_docente: mainAsg.docente.dni_docente,
          nom_docente: mainAsg.docente.nom_docente,
          ape_docente: mainAsg.docente.ape_docente,
          nom_especialidad: mainAsg.docente.nom_especialidad,
          disponibilidad: availability
        };
      }

      return {
        id_curso: c.id_curso,
        creditos: c.creditos,
        nom_curso: c.nom_curso,
        id_carrera: c.id_carrera,
        modalidad: c.modalidad,
        tipo_curso: c.tipo_curso,
        id_ciclo: c.id_ciclo,
        horas_teoricas: c.horas_teoricas,
        horas_practicas: c.horas_practicas,
        alumnos: c.alumnos,
        id_plan: c.id_plan,
        carrera: c.carrera,
        ciclo: c.ciclo,
        plan: c.plan,
        id_docente: formattedDocente?.id_docente || null,
        docente: formattedDocente,
      };
    });

    return NextResponse.json(formattedCursos);
  } catch (error) {
    console.error('Error fetching cursos:', error);
    return NextResponse.json(
      { error: 'Error al obtener cursos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Soporte para formato de frontend e interno
    const id_curso = body.id || body.id_curso
    const nom_curso = body.name || body.nom_curso
    const tipo_curso = body.type || body.tipo_curso
    const creditos = body.creditos !== undefined ? Number(body.creditos) : 1
    const modalidad = body.modalidad || DEFAULT_MODALIDAD
    const id_ciclo = body.semester !== undefined ? Number(body.semester) : (body.id_ciclo !== undefined ? Number(body.id_ciclo) : 1)
    const horas_teoricas = body.theoreticalHours !== undefined ? Number(body.theoreticalHours) : 0
    const horas_practicas = body.practicalHours !== undefined ? Number(body.practicalHours) : 0
    const alumnos = body.students !== undefined ? Number(body.students) : 0
    const id_docente = body.teacherId !== undefined ? body.teacherId : body.id_docente
    const id_usuario = body.userId

    const id_carrera = body.id_carrera || mapProgramToCarreraId(body.program || '')

    if (!id_curso || !nom_curso || !id_carrera) {
      return NextResponse.json(
        { error: 'El ID, Nombre y Carrera son requeridos' },
        { status: 400 }
      )
    }

    const sanitizedTipoCurso = sanitizeTipoCurso(tipo_curso);

    const curso = await prisma.$transaction(async (tx) => {
      const c = await tx.curso.create({
        data: {
          id_curso,
          creditos,
          nom_curso,
          id_carrera,
          modalidad,
          tipo_curso: sanitizedTipoCurso,
          id_ciclo,
          horas_teoricas,
          horas_practicas,
          alumnos,
          id_plan: body.id_plan || 'PLAN_GEN',
          id_usuario,
        },
      });

      if (id_docente) {
        await tx.asignacion.create({
          data: {
            id_asignacion: `${id_curso}-Actual`,
            id_docente,
            id_curso,
            id_periodo: 'Actual',
          }
        });
      }

      return c;
    });

    return NextResponse.json({ 
      message: 'Curso registrado exitosamente', 
      data: {
        ...curso,
        id_docente: id_docente || null
      }
    })
  } catch (error: any) {
    console.error('Error al registrar curso:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un curso con este ID' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
