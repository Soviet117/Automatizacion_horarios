import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function validateProfessorPerPeriod() {
  console.log("\n=== VALIDANDO PROFESORES ÚNICOS POR PERIODO ===\n")
  
  const periodoActual = await prisma.periodo_academico.findFirst({ where: { activo: true } })
  if (!periodoActual) {
    console.log("❌ No hay período académico activo")
    return
  }
  console.log(`📊 Período Actual: ${periodoActual.nom_periodo} (ID: ${periodoActual.id_periodo})`)
  
  // Obtener asignaciones por profesor y período
  const asignaciones = await prisma.asignacion.findMany({
    where: { id_periodo: periodoActual.id_periodo },
    include: { docente: { select: { id_docente: true, nom_docente: true, ape_docente: true } }, curso: { select: { id_curso: true, nom_curso: true, id_ciclo: true } } }
  })
  
  // Agrupar por profesor
  const profesoresConMultiplesCursos: any = {}
  for (const asignacion of asignaciones) {
    if (!profesoresConMultiplesCursos[asignacion.id_docente]) {
      profesoresConMultiplesCursos[asignacion.id_docente] = {
        nombre: `${asignacion.docente.nom_docente} ${asignacion.docente.ape_docente}`,
        cursos: []
      }
    }
    profesoresConMultiplesCursos[asignacion.id_docente].cursos.push({
      id_curso: asignacion.id_curso,
      nom_curso: asignacion.curso.nom_curso,
      id_ciclo: asignacion.curso.id_ciclo
    })
  }
  
  let violations = false
  
  // Validar cada profesor
  for (const profId of Object.keys(profesoresConMultiplesCursos)) {
    const info = profesoresConMultiplesCursos[profId]
    const cursoCount = info.cursos.length
    
    if (cursoCount > 1) {
      violations = true
      console.log(`❌ VIOLACIÓN ENCONTRADA - Profesor ${info.nombre} (${profId}): \\
   Debe dictar \\\\n    * ${info.cursos.map(c => `${c.nom_curso} (Ciclo ${c.id_ciclo})`).join('\\\\n    * ')}`)      
    } else if (cursoCount === 1) {
      console.log(`✅ Profesor ${info.nombre} dicta \\n: * ${info.cursos[0].nom_curso} (Ciclo ${info.cursos[0].id_ciclo})")
    } else {
      console.log(`ℹ️ Profesor ${info.nombre} no dicta ningún curso`)    }
  }
  
  if (violations) {
    console.log(`\n❌ TOTAL DE VIOLACIONES: ${Object.keys(profesoresConMultiplesCursos).length} profesores dictan más de 1 curso")
    console.log("📋 ACCIONES RECOMENDADAS:")
    console.log("   1. Eliminar asignaciones duplicadas")
    console.log("   2. Transferir cursos adicionales a otros profesores")
    console.log("   3. Ajustar criterios de competencia Docente-Curso")
  } else {
    console.log("\n✅ TODOS LOS PROFESORES CUMPLEN EL REQUERIMIENTO - dictan exactamente 1 curso por período activo")
  }
  
  return { violaciones, periodoActual, asignaciones }
}

async function main() {
  try {
    await validateProfessorPerPeriod()
  } catch (error) {
    console.error('Error al validar profesores:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
