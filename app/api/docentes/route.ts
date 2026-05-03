import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar campos requeridos según el modelo Prisma: docente
    const { id_docente, dni_docente, nom_docente, ape_docente, nom_especialidad } = body

    if (!id_docente || !dni_docente || !nom_docente || !ape_docente || !nom_especialidad) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const docente = {
      id_docente,
      dni_docente,
      nom_docente,
      ape_docente,
      nom_especialidad,
    }

    // Imprimir en consola del servidor
    console.log('═══════════════════════════════════════')
    console.log('📋 NUEVO DOCENTE REGISTRADO')
    console.log('═══════════════════════════════════════')
    console.log('ID Docente:    ', docente.id_docente)
    console.log('DNI:           ', docente.dni_docente)
    console.log('Nombre:        ', docente.nom_docente)
    console.log('Apellido:      ', docente.ape_docente)
    console.log('Especialidad:  ', docente.nom_especialidad)
    console.log('═══════════════════════════════════════')

    return NextResponse.json({ message: 'Docente registrado (console.log)', data: docente })
  } catch (error) {
    console.error('Error al procesar docente:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
