import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function validateProfessorConstraints() {
  console.log("\n=== VALIDACIÓN DE RESTRICCIONES DE DOCENTES ===\n")
  
  const periodoActual = await prisma.periodo_academico.findFirst({ where: { activo: true } })
  if (!periodoActual) {
    console.log("❌ No hay período académico activo")
    return
  }
  console.log(`📊 Período Actual: ${periodoActual.nom_periodo} (ID: ${periodoActual.id_periodo})`)
  
  // Obtener todas las asignaciones del período actual
  const asignaciones = await prisma.asignacion.findMany({
    where: { id_periodo: periodoActual.id_periodo },
    include: {
      docente: { select: { id_docente: true, nom_docente: true, ape_docente: true } },
      curso: { select: { id_curso: true, nom_curso: true, id_ciclo: true } }
    }
  })
  
  // Agrupar por profesor y contar cuántos cursos dicta
  const profesoresCursos = new Map()
  for (const asignacion of asignaciones) {
    if (!profesoresCursos.has(asignacion.id_docente)) {
      profesoresCursos.set(asignacion.id_docente, {
        nombre: `${asignacion.docente.nom_docente} ${asignacion.docente.ape_docente}`,
        cursos: []
      })
    }
    profesoresCursos.get(asignacion.id_docente).cursos.push(asignacion.curso)
  }
  
  // Validar 1:1 profesor-curso por período
  console.log("\n⚡ VALIDACIÓN 1:1 PROFESOR-CURSO POR PERÍODO")
  let profesorViolations = 0
  let profesorCon1Curso = 0
  
  for (const [profId, info] of profesoresCursos.entries()) {
    const cursoCount = info.cursos.length
    
    if (cursoCount > 1) {
      profesorViolations++
      console.log("❌ VIOLACIÓN - " + info.nombre + " dicta " + cursoCount + " cursos:")
      info.cursos.forEach((c: any) => {
        console.log("   * " + c.nom_curso + " (Ciclo " + c.id_ciclo + ")")      
      })
    } else if (cursoCount === 1) {
      profesorCon1Curso++
      console.log("✅ " + info.nombre + " dicta 1 curso: " + info.cursos[0].nom_curso + " (Ciclo " + info.cursos[0].id_ciclo + ")")
    }
  }
  
  // Obtener profesores sin asignaturas
  const todosLosProfesores = await prisma.docente.findMany()
  const profesoresConAsignaturas = Array.from(profesoresCursos.keys())
  const profesoresSinCursos = todosLosProfesores.filter(p => !profesoresConAsignaturas.includes(p.id_docente))
  
  if (profesoresSinCursos.length > 0) {
    console.log("\n⚠️ " + profesoresSinCursos.length + " profesores no dictan ningún curso en el período actual:")
    profesoresSinCursos.forEach(p => {
      console.log("   * " + p.nom_docente + " " + p.ape_docente + " (" + p.id_docente + ")")
    })
  } else {
    console.log("\n✅ Todos los profesores dictan al menos 1 curso en el período actual")
  }
  
  // Validar competencias Docente-Curso
  console.log("\n⚡ VALIDACIÓN DE COMPETENCIAS DOCENTE-CURSO")
  let incompatibles = 0
  const profesoresConCompetencias = await prisma.competencia_docente.findMany()
  const profesoresConCompetenciasMap = new Map()
  for (const comp of profesoresConCompetencias) {
    if (!profesoresConCompetenciasMap.has(comp.id_docente)) {
      profesoresConCompetenciasMap.set(comp.id_docente, [])
    }
    profesoresConCompetenciasMap.get(comp.id_docente).push(comp.id_curso)
  }
  
  for (const [profId, info] of profesoresCursos.entries()) {
    const competencias = profesoresConCompetenciasMap.get(profId) || []
    if (competencias.length > 0) {
      const cursosIncompatibles = info.cursos.filter((c: any) => !competencias.includes(c.id_curso))
      if (cursosIncompatibles.length > 0) {
        incompatibles++
        console.log("❌ COMPETENCIA - " + info.nombre + " (" + profId + ") tiene " + info.cursos.length + " asignaciones pero competencias solo para " + competencias.length + " cursos:")
        cursosIncompatibles.forEach((c: any) => {
          console.log("   * " + c.nom_curso + " (SIN competencia)")
        })
      } else {
        console.log("✅ " + info.nombre + " tiene competencias para todas las asignaciones:")
        competencias.forEach(cursoId => {
          const cursoAsignado = info.cursos.find((c: any) => c.id_curso === cursoId)
          if (cursoAsignado) {
            console.log("   * " + cursoAsignado.nom_curso)
          }
        })
      }
    } else {
      console.log("⚠️ " + info.nombre + " no tiene competencias definidas")
    }
  }
  
  const totalProfesores = todosLosProfesores.length
  console.log("\n📊 RESUMEN GENERAL:")
  console.log("  Total Profesores: " + totalProfesores)
  console.log("  Profesores con 1 curso: " + profesorCon1Curso)
  console.log("  Profesores con >1 curso: " + profesorViolations)
  console.log("  Profesores sin asignaturas: " + profesoresSinCursos.length)
  console.log("  Incompatibilidades de competencias: " + incompatibles)
  
  return {
    profesoresCursos: Array.from(profesoresCursos.entries()),
    violacionesProfesor: profesorViolations,
    periodoActual,
    totalProfesores
  }
}

async function main() {
  try {
    const resultado = await validateProfessorConstraints()
    let incompatibles = 0
    if (resultado.profesoresCursos) {
      for (const [profId, info] of resultado.profesoresCursos.entries()) {
        const competencias = await prisma.competencia_docente.findMany({ where: { id_docente: profId } })
          .then(comp => comp.map(c => c.id_curso))
        
        const cursosIncompatibles = info.cursos.filter((c: any) => !competencias.includes(c.id_curso))
        if (cursosIncompatibles.length > 0) {
          incompatibles++
        }
      }
    }
    
    console.log("\n🎯 RESUMEN FINAL:")
    if (resultado.violacionesProfesor === 0 && resultado.profesoresCursos) {
      const profesoresSinCursos = await prisma.docente.findMany()
        .then(profs => profs.filter(p => !Array.from(resultado.profesoresCursos.keys()).includes(p.id_docente)))
        
      if (profesoresSinCursos.length === 0) {
        console.log("✅ TODOS LOS REQUISITOS CUMPLEN: profesores únicos por período, competencias sincronizadas")
      } else {
        console.log("❌ REQUISITOS INCOMPLETOS - algunos profesores no dictan")
      }
    } else {
      console.log("❌ REQUISITOS INCOMPLETOS - deben corregirse las violaciones")
      console.log("   📋 Total de ajustes necesarios: " + resultado.violacionesProfesor)
    }
    return resultado
  } catch (error) {
    console.error('Error al validar:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
