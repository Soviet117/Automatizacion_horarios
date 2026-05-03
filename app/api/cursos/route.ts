import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar campos requeridos según el modelo Prisma: curso
    const { id_curso, creditos, nom_curso, id_carrera, modalidad, tipo_curso, id_ciclo } = body

    if (!id_curso || !creditos || !nom_curso || !id_carrera || !modalidad || !tipo_curso || !id_ciclo) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const curso = {
      id_curso,
      creditos: Number(creditos),
      nom_curso,
      id_carrera,
      modalidad,
      tipo_curso,
      id_ciclo: Number(id_ciclo),
    }

    // Imprimir en consola del servidor
    console.log('═══════════════════════════════════════')
    console.log('📚 NUEVO CURSO REGISTRADO')
    console.log('═══════════════════════════════════════')
    console.log('ID Curso:      ', curso.id_curso)
    console.log('Créditos:      ', curso.creditos)
    console.log('Nombre:        ', curso.nom_curso)
    console.log('ID Carrera:    ', curso.id_carrera)
    console.log('Modalidad:     ', curso.modalidad)
    console.log('Tipo Curso:    ', curso.tipo_curso)
    console.log('ID Ciclo:      ', curso.id_ciclo)
    console.log('═══════════════════════════════════════')

    return NextResponse.json({ message: 'Curso registrado (console.log)', data: curso })
  } catch (error) {
    console.error('Error al procesar curso:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
