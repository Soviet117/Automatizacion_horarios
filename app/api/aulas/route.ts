import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar campos requeridos según el modelo Prisma: aula
    const { id_aula, nom_aula, id_tipo_aula, capacidad } = body

    if (!id_aula || !nom_aula || !id_tipo_aula || !capacidad) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const aula = {
      id_aula,
      nom_aula,
      id_tipo_aula,
      capacidad: Number(capacidad),
    }

    // Imprimir en consola del servidor
    console.log('═══════════════════════════════════════')
    console.log('🏫 NUEVA AULA REGISTRADA')
    console.log('═══════════════════════════════════════')
    console.log('ID Aula:       ', aula.id_aula)
    console.log('Nombre:        ', aula.nom_aula)
    console.log('ID Tipo Aula:  ', aula.id_tipo_aula)
    console.log('Capacidad:     ', aula.capacidad)
    console.log('═══════════════════════════════════════')

    return NextResponse.json({ message: 'Aula registrada (console.log)', data: aula })
  } catch (error) {
    console.error('Error al procesar aula:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
