import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // 1. Limpiar datos existentes (en orden inverso de dependencias para evitar errores de llave foránea)
  console.log('Limpiando base de datos...');
  await prisma.horario_sesion.deleteMany();
  await prisma.asignacion.deleteMany();
  await prisma.disponibilidad_docente.deleteMany();
  await prisma.aula.deleteMany();
  await prisma.tipo_aula.deleteMany();
  await prisma.competencia_docente.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.docente.deleteMany();
  await prisma.plan_estudio.deleteMany();
  await prisma.carrera.deleteMany();
  await prisma.facultad.deleteMany();
  await prisma.periodo_academico.deleteMany();
  await prisma.tipo_sesion.deleteMany();
  await prisma.ciclo.deleteMany();
  await prisma.dia_semana.deleteMany();
  await prisma.bloque_horario.deleteMany();
  await prisma.escenario.deleteMany();

  // 2. Poblar datos maestros básicos
  console.log('Creando datos maestros...');
  
  // Días de la semana (0 a 4 coincidiendo con el frontend)
  const dias = [
    { id_dia: 0, nom_dia: 'Lunes' },
    { id_dia: 1, nom_dia: 'Martes' },
    { id_dia: 2, nom_dia: 'Miércoles' },
    { id_dia: 3, nom_dia: 'Jueves' },
    { id_dia: 4, nom_dia: 'Viernes' }
  ];
  await prisma.dia_semana.createMany({ data: dias });

  // Bloques horarios (0 a 7 coincidiendo con el frontend)
  const horarios = [
    { i: 0, start: '07:00', end: '08:20' },
    { i: 1, start: '08:30', end: '10:00' },
    { i: 2, start: '10:15', end: '11:45' },
    { i: 3, start: '12:00', end: '13:30' },
    { i: 4, start: '15:45', end: '17:15' },
    { i: 5, start: '17:30', end: '19:00' },
    { i: 6, start: '19:10', end: '20:40' },
    { i: 7, start: '20:50', end: '22:20' }
  ];
  const bloques = horarios.map(h => ({
    id_bloque: h.i,
    horario_inicio: h.start,
    horario_fin: h.end
  }));
  await prisma.bloque_horario.createMany({ data: bloques });

  // Periodos Académicos
  const periodo1 = await prisma.periodo_academico.create({
    data: { id_periodo: '2026-1', nom_periodo: 'Semestre 2026-I', activo: true }
  });
  const periodo2 = await prisma.periodo_academico.create({
    data: { id_periodo: '2025-2', nom_periodo: 'Semestre 2025-II', activo: false }
  });

  // Tipos de Sesión
  const tipoTeoria = await prisma.tipo_sesion.create({ data: { nom_tipo_sesion: 'Teoría' } });
  const tipoPractica = await prisma.tipo_sesion.create({ data: { nom_tipo_sesion: 'Práctica' } });
  const tipoLaboratorio = await prisma.tipo_sesion.create({ data: { nom_tipo_sesion: 'Laboratorio' } });

  // Ciclos
  const ciclos = Array.from({ length: 10 }).map((_, i) => ({ id_ciclo: i + 1, nom_ciclo: `Ciclo ${i + 1}` }));
  await prisma.ciclo.createMany({ data: ciclos });

  // Tipos de Aula
  const tipoAulaNormal = await prisma.tipo_aula.create({ data: { id_tipo_aula: 'TA01', nom_tipo_aula: 'Aula Teórica' } });
  const tipoAulaLab = await prisma.tipo_aula.create({ data: { id_tipo_aula: 'TA02', nom_tipo_aula: 'Laboratorio Cómputo' } });
  const tipoAulaTaller = await prisma.tipo_aula.create({ data: { id_tipo_aula: 'TA03', nom_tipo_aula: 'Taller Especializado' } });

  // 3. Estructura Académica
  const facIngenieria = await prisma.facultad.create({
    data: { nom_facultad: 'Facultad de Ingeniería' }
  });
  const facSalud = await prisma.facultad.create({
    data: { nom_facultad: 'Facultad de Ciencias de la Salud' }
  });

  const carrSistemas = await prisma.carrera.create({
    data: { nom_carrera: 'Ingeniería de Sistemas', id_facultad: facIngenieria.id_facultad }
  });
  const carrElectronica = await prisma.carrera.create({
    data: { nom_carrera: 'Ingeniería Electrónica', id_facultad: facIngenieria.id_facultad }
  });
  const carrEnfermeria = await prisma.carrera.create({
    data: { nom_carrera: 'Enfermería', id_facultad: facSalud.id_facultad }
  });

  const planSistemas = await prisma.plan_estudio.create({
    data: { nom_plan: 'Plan 2026 - Sistemas', id_carrera: carrSistemas.id_carrera }
  });
  const planElectronica = await prisma.plan_estudio.create({
    data: { nom_plan: 'Plan 2026 - Electrónica', id_carrera: carrElectronica.id_carrera }
  });
  const planEnfermeria = await prisma.plan_estudio.create({
    data: { nom_plan: 'Plan 2026 - Enfermería', id_carrera: carrEnfermeria.id_carrera }
  });

  // 4. Aulas
  console.log('Creando aulas...');
  const aulasData = [
    { id_aula: 'A-101', nom_aula: 'Aula A-101', id_tipo_aula: tipoAulaNormal.id_tipo_aula, capacidad: 40 },
    { id_aula: 'A-102', nom_aula: 'Aula A-102', id_tipo_aula: tipoAulaNormal.id_tipo_aula, capacidad: 35 },
    { id_aula: 'A-201', nom_aula: 'Aula A-201', id_tipo_aula: tipoAulaNormal.id_tipo_aula, capacidad: 45 },
    { id_aula: 'LAB-COMP-A', nom_aula: 'Lab Cómputo A', id_tipo_aula: tipoAulaLab.id_tipo_aula, capacidad: 30 },
    { id_aula: 'LAB-COMP-B', nom_aula: 'Lab Cómputo B', id_tipo_aula: tipoAulaLab.id_tipo_aula, capacidad: 30 },
    { id_aula: 'TALLER-ELEC', nom_aula: 'Taller Electrónica', id_tipo_aula: tipoAulaTaller.id_tipo_aula, capacidad: 25 },
    { id_aula: 'A-301', nom_aula: 'Aula A-301', id_tipo_aula: tipoAulaNormal.id_tipo_aula, capacidad: 50 },
    { id_aula: 'LAB-CLIN', nom_aula: 'Lab Clínico', id_tipo_aula: tipoAulaLab.id_tipo_aula, capacidad: 20 },
  ];
  await prisma.aula.createMany({ data: aulasData });
  const aulas = await prisma.aula.findMany();

  // 5. Cursos
  console.log('Creando cursos...');
  const cursosData = [
    // Sistemas
    { id_curso: 'SIS101', nom_curso: 'Programación Básica', creditos: 4, alumnos: 40, horas_teoricas: 2, horas_practicas: 2, id_carrera: carrSistemas.id_carrera, id_ciclo: 1, modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion, id_plan: planSistemas.id_plan },
    { id_curso: 'SIS102', nom_curso: 'Base de Datos I', creditos: 4, alumnos: 35, horas_teoricas: 2, horas_practicas: 2, id_carrera: carrSistemas.id_carrera, id_ciclo: 3, modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion, id_plan: planSistemas.id_plan },
    { id_curso: 'SIS103', nom_curso: 'Ingeniería de Software', creditos: 3, alumnos: 30, horas_teoricas: 3, horas_practicas: 0, id_carrera: carrSistemas.id_carrera, id_ciclo: 5, modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion, id_plan: planSistemas.id_plan },
    // Electrónica
    { id_curso: 'ELE101', nom_curso: 'Circuitos I', creditos: 4, alumnos: 25, horas_teoricas: 2, horas_practicas: 2, id_carrera: carrElectronica.id_carrera, id_ciclo: 2, modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion, id_plan: planElectronica.id_plan },
    { id_curso: 'ELE102', nom_curso: 'Microcontroladores', creditos: 4, alumnos: 20, horas_teoricas: 2, horas_practicas: 2, id_carrera: carrElectronica.id_carrera, id_ciclo: 6, modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion, id_plan: planElectronica.id_plan },
    // Enfermería
    { id_curso: 'ENF101', nom_curso: 'Anatomía', creditos: 5, alumnos: 45, horas_teoricas: 3, horas_practicas: 2, id_carrera: carrEnfermeria.id_carrera, id_ciclo: 1, modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion, id_plan: planEnfermeria.id_plan },
    { id_curso: 'ENF102', nom_curso: 'Primeros Auxilios', creditos: 3, alumnos: 40, horas_teoricas: 1, horas_practicas: 2, id_carrera: carrEnfermeria.id_carrera, id_ciclo: 2, modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion, id_plan: planEnfermeria.id_plan },
  ];
  await prisma.curso.createMany({ data: cursosData });
  const cursos = await prisma.curso.findMany();

  // 6. Docentes con competencias lógicas por especialidad
  console.log('Creando docentes con competencias lógicas...');

  const competenciasPorDocente: Record<string, string[]> = {
    'D001': ['SIS101', 'SIS102', 'SIS103'],  // Juan Pérez - Sistemas
    'D002': ['SIS102', 'SIS103', 'ELE101'],  // María Gómez - Base de Datos + Circuitos
    'D003': ['ELE101', 'ELE102'],             // Carlos López - Electrónica
    'D004': ['ENF101', 'ENF102'],             // Ana Martínez - Enfermería
    'D005': ['SIS101', 'ENF101', 'ELE102'],  // Luis Rodríguez - Ciencias Básicas
  };

  const docentesData = [
    { id_docente: 'D001', dni_docente: '11111111', nom_docente: 'Juan', ape_docente: 'Pérez', nom_especialidad: 'Sistemas' },
    { id_docente: 'D002', dni_docente: '22222222', nom_docente: 'María', ape_docente: 'Gómez', nom_especialidad: 'Base de Datos' },
    { id_docente: 'D003', dni_docente: '33333333', nom_docente: 'Carlos', ape_docente: 'López', nom_especialidad: 'Electrónica' },
    { id_docente: 'D004', dni_docente: '44444444', nom_docente: 'Ana', ape_docente: 'Martínez', nom_especialidad: 'Enfermería' },
    { id_docente: 'D005', dni_docente: '55555555', nom_docente: 'Luis', ape_docente: 'Rodríguez', nom_especialidad: 'Ciencias Básicas' },
  ];
  await prisma.docente.createMany({ data: docentesData });
  const docentes = await prisma.docente.findMany();

  console.log('Asignando competencias y disponibilidades a docentes...');
  let idDisp = 1;
  for (const doc of docentes) {
    const cursosHabilitados = competenciasPorDocente[doc.id_docente] ?? [];
    for (const idCurso of cursosHabilitados) {
      await prisma.competencia_docente.create({
        data: { id_docente: doc.id_docente, id_curso: idCurso }
      });
    }
    // Disponibilidad: todos los bloques (5 días × 8 bloques)
    for (let d = 0; d < 5; d++) {
      for (let b = 0; b < 8; b++) {
        await prisma.disponibilidad_docente.create({
          data: {
            id_disponibilidad: `DISP-${idDisp++}`,
            id_docente: doc.id_docente,
            id_dia: d,
            id_bloque: b
          }
        });
      }
    }
  }


  // Escenario
  console.log('Creando escenario de simulación...');
  const escenario = await prisma.escenario.create({
    data: {
      nom_escenario: 'Simulación Semestre 2026-I V1',
      descripcion: 'Primera iteración generada por el CSP Solver',
      estado: 'simulation',
      cobertura: 85,
      conflictos: 2
    }
  });

      // 7. Asignaciones: elegir docente competente para cada curso
      console.log('Generando asignaciones coherentes (docente con competencia)...');

      let idAsignacionCounter = 1;
      let idHorarioCounter = 1;

      // Reconstruir mapa competencias en memoria para usarlo al elegir docente
      const competencias = await prisma.competencia_docente.findMany();
      const docentesPorCurso: Record<string, string[]> = {};
      for (const c of competencias) {
        if (!docentesPorCurso[c.id_curso]) docentesPorCurso[c.id_curso] = [];
        docentesPorCurso[c.id_curso].push(c.id_docente);
      }

      // Nueva lógica: asignar exactamente 1 curso por profesor por período
      const docentes = await prisma.docente.findMany();
      const cursosAsignados: Record<string, string> = {};
      
      // Distribuir cursos a profesores
      for (const curso of cursos) {
        const docentesHabilitados = docentesPorCurso[curso.id_curso] ?? [];
        if (docentesHabilitados.length === 0) {
          console.warn(`  WARN: Curso ${curso.id_curso} sin docente habilitado, se omite asignación.`);
          continue;
        }
        
        // Escoger un docente que NO tenga aún un curso asignado este período
        let docenteElegido = null;
        const candidatos = docentesHabilitados.filter(id_docente => {
          const yaAsignado = Object.entries(cursosAsignados).find(([_, cCurso]) => cCurso === id_docente);
          return !yaAsignado;
        });
        
        if (candidatos.length > 0) {
          docenteElegido = candidatos[Math.floor(Math.random() * candidatos.length)];
        } else {
          // Si todos ya tienen un curso, usar el primero disponible
          docenteElegido = docentesHabilitados[0];
        }
        
        if (docenteElegido) {
          cursosAsignados[curso.id_curso] = docenteElegido;
          const docente = docentes.find(d => d.id_docente === docenteElegido)!;
          
          // Crear asignación
          const asignacion = await prisma.asignacion.create({
            data: {
              id_asignacion: `ASG-${idAsignacionCounter++}`,
        id_docente: docente.id_docente,
        id_curso: curso.id_curso,
        id_periodo: periodo1.id_periodo
      }
    });

    // Simular 3 a 5 sesiones (bloques) por curso a la semana
    const sesionesPorCurso = Math.floor(Math.random() * 3) + 3; 

    for (let i = 0; i < sesionesPorCurso; i++) {
      // Elegir un día, bloque y aula al azar
      const dia = dias[Math.floor(Math.random() * dias.length)];
      const bloque = bloques[Math.floor(Math.random() * bloques.length)]; // Entre los 5 bloques
      const aula = aulas[Math.floor(Math.random() * aulas.length)];

      try {
        await prisma.horario_sesion.create({
          data: {
            id_horario: `HS-${idHorarioCounter++}`,
            id_asignacion: asignacion.id_asignacion,
            id_docente: docente.id_docente,
            id_periodo: periodo1.id_periodo,
            id_aula: aula.id_aula,
            id_dia: dia.id_dia,
            id_bloque: bloque.id_bloque,
            tipo_sesion: i % 2 === 0 ? tipoTeoria.id_tipo_sesion : tipoPractica.id_tipo_sesion
          }
        });
        
        // Simular también sesiones para el escenario de prueba
        await prisma.horario_sesion.create({
          data: {
            id_horario: `HS-ESC-${idHorarioCounter++}`,
            id_asignacion: asignacion.id_asignacion,
            id_docente: docente.id_docente,
            id_periodo: periodo1.id_periodo,
            id_aula: aula.id_aula,
            id_dia: dia.id_dia,
            id_bloque: bloque.id_bloque,
            tipo_sesion: tipoLaboratorio.id_tipo_sesion,
            id_escenario: escenario.id_escenario
          }
        });
      } catch (e) {
        // Ignorar conflictos de llaves únicas (unique constraints en BD) generados por el azar
      }
    }
  }

  // Generar algunos datos para el semestre anterior (periodo2)
  for (let i = 0; i < 10; i++) {
    const curso = cursos[Math.floor(Math.random() * cursos.length)];
    const docente = docentes[Math.floor(Math.random() * docentes.length)];
    const dia = dias[Math.floor(Math.random() * dias.length)];
    const bloque = bloques[Math.floor(Math.random() * bloques.length)];
    const aula = aulas[Math.floor(Math.random() * aulas.length)];

    try {
      const asg = await prisma.asignacion.create({
        data: {
          id_asignacion: `ASG-OLD-${i}`,
          id_docente: docente.id_docente,
          id_curso: curso.id_curso,
          id_periodo: periodo2.id_periodo
        }
      });

      await prisma.horario_sesion.create({
        data: {
          id_horario: `HS-OLD-${i}`,
          id_asignacion: asg.id_asignacion,
          id_docente: docente.id_docente,
          id_periodo: periodo2.id_periodo,
          id_aula: aula.id_aula,
          id_dia: dia.id_dia,
          id_bloque: bloque.id_bloque,
          tipo_sesion: tipoTeoria.id_tipo_sesion
        }
      });
    } catch (e) {
      // Ignorar conflictos
    }
  }

  console.log('Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
