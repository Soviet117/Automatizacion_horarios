import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed con datos reales...');

  // 1. Limpiar
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

  // 2. Datos maestros
  console.log('Creando datos maestros...');

  // Días (0-4 = Lunes-Viernes)
  const dias = [
    { id_dia: 0, nom_dia: 'Lunes' },
    { id_dia: 1, nom_dia: 'Martes' },
    { id_dia: 2, nom_dia: 'Miércoles' },
    { id_dia: 3, nom_dia: 'Jueves' },
    { id_dia: 4, nom_dia: 'Viernes' }
  ];
  await prisma.dia_semana.createMany({ data: dias });

  // Bloques (0-7)
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
  await prisma.bloque_horario.createMany({
    data: horarios.map(h => ({ id_bloque: h.i, horario_inicio: h.start, horario_fin: h.end }))
  });

  // Periodos
  await prisma.periodo_academico.createMany({
    data: [
      { id_periodo: '2026-1', nom_periodo: 'Semestre 2026-I', activo: true },
      { id_periodo: '2025-2', nom_periodo: 'Semestre 2025-II', activo: false }
    ]
  });

  // Tipos de sesión
  const tipoTeoria = await prisma.tipo_sesion.create({ data: { nom_tipo_sesion: 'Teoría' } });
  const tipoPractica = await prisma.tipo_sesion.create({ data: { nom_tipo_sesion: 'Práctica' } });
  const tipoLabComputo = await prisma.tipo_sesion.create({ data: { nom_tipo_sesion: 'Lab. Cómputo' } });
  const tipoTaller = await prisma.tipo_sesion.create({ data: { nom_tipo_sesion: 'Taller' } });

  // Ciclos
  await prisma.ciclo.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({ id_ciclo: i + 1, nom_ciclo: `Ciclo ${i + 1}` }))
  });

  // Tipos de aula (limpios: solo los que usamos)
  const tipoClassroom = await prisma.tipo_aula.create({ data: { id_tipo_aula: 'classroom', nom_tipo_aula: 'Aula Teórica' } });
  const tipoCompLab = await prisma.tipo_aula.create({ data: { id_tipo_aula: 'computer-lab', nom_tipo_aula: 'Laboratorio Cómputo' } });
  const tipoWorkshop = await prisma.tipo_aula.create({ data: { id_tipo_aula: 'workshop', nom_tipo_aula: 'Taller Especializado' } });

  // 3. Facultad y carreras
  const facIngenieria = await prisma.facultad.create({ data: { nom_facultad: 'Facultad de Ingeniería' } });
  const facSalud = await prisma.facultad.create({ data: { nom_facultad: 'Facultad de Ciencias de la Salud' } });

  const carreraSistemas = await prisma.carrera.create({
    data: { nom_carrera: 'Ingeniería de Sistemas', id_facultad: facIngenieria.id_facultad }
  });
  const carreraElectronica = await prisma.carrera.create({
    data: { nom_carrera: 'Ingeniería Electrónica', id_facultad: facIngenieria.id_facultad }
  });
  const carreraEnfermeria = await prisma.carrera.create({
    data: { nom_carrera: 'Enfermería', id_facultad: facSalud.id_facultad }
  });

  const planSistemas = await prisma.plan_estudio.create({
    data: { nom_plan: 'Plan 2026 - Sistemas', id_carrera: carreraSistemas.id_carrera }
  });
  await prisma.plan_estudio.createMany({
    data: [
      { nom_plan: 'Plan 2026 - Electrónica', id_carrera: carreraElectronica.id_carrera },
      { nom_plan: 'Plan 2026 - Enfermería', id_carrera: carreraEnfermeria.id_carrera }
    ]
  });

  // 4. Aulas (datos reales del usuario)
  const aulasData = [
    { id_aula: 'A-101', nom_aula: 'A-101', id_tipo_aula: 'classroom', capacidad: 30 },
    { id_aula: 'A-102', nom_aula: 'A-102', id_tipo_aula: 'classroom', capacidad: 30 },
    { id_aula: 'B-201', nom_aula: 'B-201', id_tipo_aula: 'workshop', capacidad: 30 },
    { id_aula: 'C-301', nom_aula: 'C-301', id_tipo_aula: 'computer-lab', capacidad: 30 },
    { id_aula: 'D-401', nom_aula: 'D-401', id_tipo_aula: 'workshop', capacidad: 30 },
  ];
  for (const a of aulasData) {
    await prisma.aula.create({ data: a });
  }

  // 5. Docentes
  const docenteHuanca = await prisma.docente.create({
    data: { id_docente: 'D001', dni_docente: '11111111', nom_docente: 'Huanca', ape_docente: 'Runa', nom_especialidad: 'Doctor en sistemas' }
  });
  const docenteVilla = await prisma.docente.create({
    data: { id_docente: 'D002', dni_docente: '22222222', nom_docente: 'Villa', ape_docente: 'Fuerte', nom_especialidad: 'Ingenieria en ciberseguridad' }
  });

  // 6. Cursos (datos reales del usuario)
  await prisma.curso.create({
    data: {
      id_curso: 'ESTR1', nom_curso: 'Estructuras discretas', creditos: 3,
      horas_teoricas: 1, horas_practicas: 2, alumnos: 25,
      id_carrera: carreraSistemas.id_carrera, id_ciclo: 1,
      modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion,
      id_plan: planSistemas.id_plan
    }
  });
  await prisma.curso.create({
    data: {
      id_curso: 'FUN1', nom_curso: 'Fundamentos de sistemas', creditos: 3,
      horas_teoricas: 2, horas_practicas: 1, alumnos: 25,
      id_carrera: carreraSistemas.id_carrera, id_ciclo: 1,
      modalidad: 'Presencial', tipo_curso: tipoTeoria.id_tipo_sesion,
      id_plan: planSistemas.id_plan
    }
  });

  // 7. Competencias docentes
  await prisma.competencia_docente.createMany({
    data: [
      { id_docente: 'D001', id_curso: 'ESTR1' },
      { id_docente: 'D002', id_curso: 'FUN1' }
    ]
  });

  // 8. Disponibilidades (datos reales del usuario)
  await prisma.disponibilidad_docente.createMany({
    data: [
      // Huanca: slot 6 (19:10-20:40) L-V
      { id_disponibilidad: 'DISP-1', id_docente: 'D001', id_dia: 0, id_bloque: 6 },
      { id_disponibilidad: 'DISP-2', id_docente: 'D001', id_dia: 1, id_bloque: 6 },
      { id_disponibilidad: 'DISP-3', id_docente: 'D001', id_dia: 2, id_bloque: 6 },
      { id_disponibilidad: 'DISP-4', id_docente: 'D001', id_dia: 3, id_bloque: 6 },
      { id_disponibilidad: 'DISP-5', id_docente: 'D001', id_dia: 4, id_bloque: 6 },
      // Villa: slot 7 (20:50-22:20) L-V
      { id_disponibilidad: 'DISP-6', id_docente: 'D002', id_dia: 0, id_bloque: 7 },
      { id_disponibilidad: 'DISP-7', id_docente: 'D002', id_dia: 1, id_bloque: 7 },
      { id_disponibilidad: 'DISP-8', id_docente: 'D002', id_dia: 2, id_bloque: 7 },
      { id_disponibilidad: 'DISP-9', id_docente: 'D002', id_dia: 3, id_bloque: 7 },
      { id_disponibilidad: 'DISP-10', id_docente: 'D002', id_dia: 4, id_bloque: 7 },
    ]
  });

  // 9. Asignaciones (lo que faltaba para que el solver funcione)
  await prisma.asignacion.create({
    data: {
      id_asignacion: 'ASG-001', id_docente: 'D001',
      id_curso: 'ESTR1', id_periodo: '2026-1'
    }
  });
  await prisma.asignacion.create({
    data: {
      id_asignacion: 'ASG-002', id_docente: 'D002',
      id_curso: 'FUN1', id_periodo: '2026-1'
    }
  });

  // 10. Configuración CSP por defecto
  await prisma.configuracion_csp.upsert({
    where: { id: 'global' },
    create: { id: 'global' },
    update: {},
  });

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
