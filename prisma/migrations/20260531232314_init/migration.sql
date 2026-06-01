-- CreateTable
CREATE TABLE "facultad" (
    "id_facultad" VARCHAR NOT NULL,
    "nom_facultad" VARCHAR NOT NULL,

    CONSTRAINT "facultad_pk" PRIMARY KEY ("id_facultad")
);

-- CreateTable
CREATE TABLE "carrera" (
    "id_carrera" VARCHAR NOT NULL,
    "nom_carrera" VARCHAR NOT NULL,
    "id_facultad" VARCHAR NOT NULL,

    CONSTRAINT "carrera_pk" PRIMARY KEY ("id_carrera")
);

-- CreateTable
CREATE TABLE "plan_estudio" (
    "id_plan" VARCHAR NOT NULL,
    "nom_plan" VARCHAR NOT NULL,
    "id_carrera" VARCHAR NOT NULL,

    CONSTRAINT "plan_estudio_pk" PRIMARY KEY ("id_plan")
);

-- CreateTable
CREATE TABLE "ciclo" (
    "id_ciclo" INTEGER NOT NULL,
    "nom_ciclo" VARCHAR NOT NULL,

    CONSTRAINT "ciclo_pk" PRIMARY KEY ("id_ciclo")
);

-- CreateTable
CREATE TABLE "tipo_sesion" (
    "id_tipo_sesion" VARCHAR NOT NULL,
    "nom_tipo_sesion" VARCHAR NOT NULL,

    CONSTRAINT "tipo_sesion_pk" PRIMARY KEY ("id_tipo_sesion")
);

-- CreateTable
CREATE TABLE "curso" (
    "id_curso" VARCHAR NOT NULL,
    "creditos" INTEGER NOT NULL,
    "nom_curso" VARCHAR NOT NULL,
    "id_carrera" VARCHAR NOT NULL,
    "modalidad" VARCHAR NOT NULL,
    "tipo_curso" VARCHAR NOT NULL,
    "id_ciclo" INTEGER NOT NULL,
    "horas_teoricas" INTEGER NOT NULL DEFAULT 0,
    "horas_practicas" INTEGER NOT NULL DEFAULT 0,
    "alumnos" INTEGER NOT NULL DEFAULT 0,
    "id_plan" VARCHAR,
    "id_usuario" VARCHAR,

    CONSTRAINT "curso_pk" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "docente" (
    "id_docente" VARCHAR NOT NULL,
    "dni_docente" VARCHAR NOT NULL,
    "nom_docente" VARCHAR NOT NULL,
    "ape_docente" VARCHAR NOT NULL,
    "nom_especialidad" VARCHAR NOT NULL,
    "id_usuario" VARCHAR,

    CONSTRAINT "docente_pk" PRIMARY KEY ("id_docente")
);

-- CreateTable
CREATE TABLE "disponibilidad_docente" (
    "id_disponibilidad" VARCHAR NOT NULL,
    "id_docente" VARCHAR NOT NULL,
    "id_dia" INTEGER NOT NULL,
    "id_bloque" INTEGER NOT NULL,

    CONSTRAINT "disponibilidad_docente_pk" PRIMARY KEY ("id_disponibilidad")
);

-- CreateTable
CREATE TABLE "aula" (
    "id_aula" VARCHAR NOT NULL,
    "nom_aula" VARCHAR NOT NULL,
    "id_tipo_aula" VARCHAR NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "id_usuario" VARCHAR,

    CONSTRAINT "aula_pk" PRIMARY KEY ("id_aula")
);

-- CreateTable
CREATE TABLE "tipo_aula" (
    "id_tipo_aula" VARCHAR NOT NULL,
    "nom_tipo_aula" VARCHAR NOT NULL,

    CONSTRAINT "tipo_aula_pk" PRIMARY KEY ("id_tipo_aula")
);

-- CreateTable
CREATE TABLE "periodo_academico" (
    "id_periodo" VARCHAR NOT NULL,
    "nom_periodo" VARCHAR NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "periodo_academico_pk" PRIMARY KEY ("id_periodo")
);

-- CreateTable
CREATE TABLE "dia_semana" (
    "id_dia" INTEGER NOT NULL,
    "nom_dia" VARCHAR NOT NULL,

    CONSTRAINT "dia_semana_pk" PRIMARY KEY ("id_dia")
);

-- CreateTable
CREATE TABLE "bloque_horario" (
    "id_bloque" INTEGER NOT NULL,
    "horario_inicio" VARCHAR NOT NULL,
    "horario_fin" VARCHAR NOT NULL,

    CONSTRAINT "bloque_horario_pk" PRIMARY KEY ("id_bloque")
);

-- CreateTable
CREATE TABLE "asignacion" (
    "id_asignacion" VARCHAR NOT NULL,
    "id_docente" VARCHAR NOT NULL,
    "id_curso" VARCHAR NOT NULL,
    "id_periodo" VARCHAR NOT NULL,

    CONSTRAINT "asignacion_pk" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "horario_sesion" (
    "id_horario" VARCHAR NOT NULL,
    "id_asignacion" VARCHAR NOT NULL,
    "id_docente" VARCHAR NOT NULL,
    "id_periodo" VARCHAR NOT NULL,
    "id_aula" VARCHAR NOT NULL,
    "id_dia" INTEGER NOT NULL,
    "id_bloque" INTEGER NOT NULL,
    "tipo_sesion" VARCHAR NOT NULL,
    "id_usuario" VARCHAR,

    CONSTRAINT "horario_sesion_pk" PRIMARY KEY ("id_horario")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "nombre" VARCHAR NOT NULL,

    CONSTRAINT "usuario_pk" PRIMARY KEY ("id_usuario")
);

-- CreateIndex
CREATE INDEX "disponibilidad_docente_id_docente_idx" ON "disponibilidad_docente"("id_docente");

-- CreateIndex
CREATE UNIQUE INDEX "disponibilidad_docente_uq" ON "disponibilidad_docente"("id_docente", "id_dia", "id_bloque");

-- CreateIndex
CREATE INDEX "asignacion_id_docente_idx" ON "asignacion"("id_docente");

-- CreateIndex
CREATE INDEX "asignacion_id_curso_idx" ON "asignacion"("id_curso");

-- CreateIndex
CREATE INDEX "asignacion_id_periodo_idx" ON "asignacion"("id_periodo");

-- CreateIndex
CREATE UNIQUE INDEX "asignacion_uq" ON "asignacion"("id_docente", "id_curso", "id_periodo");

-- CreateIndex
CREATE INDEX "horario_sesion_id_asignacion_idx" ON "horario_sesion"("id_asignacion");

-- CreateIndex
CREATE INDEX "horario_sesion_id_aula_idx" ON "horario_sesion"("id_aula");

-- CreateIndex
CREATE INDEX "horario_sesion_id_docente_idx" ON "horario_sesion"("id_docente");

-- CreateIndex
CREATE UNIQUE INDEX "horario_sesion_docente_uq" ON "horario_sesion"("id_docente", "id_dia", "id_bloque", "id_periodo");

-- CreateIndex
CREATE UNIQUE INDEX "horario_sesion_aula_uq" ON "horario_sesion"("id_aula", "id_dia", "id_bloque", "id_periodo");

-- CreateIndex
CREATE UNIQUE INDEX "horario_sesion_asignacion_uq" ON "horario_sesion"("id_asignacion", "id_dia", "id_bloque", "tipo_sesion");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- AddForeignKey
ALTER TABLE "carrera" ADD CONSTRAINT "carrera_facultad_fk" FOREIGN KEY ("id_facultad") REFERENCES "facultad"("id_facultad") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_estudio" ADD CONSTRAINT "plan_estudio_carrera_fk" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id_carrera") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_carrera_fk" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id_carrera") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_ciclo_fk" FOREIGN KEY ("id_ciclo") REFERENCES "ciclo"("id_ciclo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_tipo_sesion_fk" FOREIGN KEY ("tipo_curso") REFERENCES "tipo_sesion"("id_tipo_sesion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_plan_estudio_fk" FOREIGN KEY ("id_plan") REFERENCES "plan_estudio"("id_plan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docente" ADD CONSTRAINT "docente_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_docente" ADD CONSTRAINT "disponibilidad_docente_docente_fk" FOREIGN KEY ("id_docente") REFERENCES "docente"("id_docente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_docente" ADD CONSTRAINT "disponibilidad_docente_dia_fk" FOREIGN KEY ("id_dia") REFERENCES "dia_semana"("id_dia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_docente" ADD CONSTRAINT "disponibilidad_docente_bloque_fk" FOREIGN KEY ("id_bloque") REFERENCES "bloque_horario"("id_bloque") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_tipo_aula_fk" FOREIGN KEY ("id_tipo_aula") REFERENCES "tipo_aula"("id_tipo_aula") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_docente_fk" FOREIGN KEY ("id_docente") REFERENCES "docente"("id_docente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_curso_fk" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_periodo_fk" FOREIGN KEY ("id_periodo") REFERENCES "periodo_academico"("id_periodo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_sesion" ADD CONSTRAINT "horario_sesion_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_sesion" ADD CONSTRAINT "horario_sesion_asignacion_fk" FOREIGN KEY ("id_asignacion") REFERENCES "asignacion"("id_asignacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_sesion" ADD CONSTRAINT "horario_sesion_docente_fk" FOREIGN KEY ("id_docente") REFERENCES "docente"("id_docente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_sesion" ADD CONSTRAINT "horario_sesion_periodo_fk" FOREIGN KEY ("id_periodo") REFERENCES "periodo_academico"("id_periodo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_sesion" ADD CONSTRAINT "horario_sesion_aula_fk" FOREIGN KEY ("id_aula") REFERENCES "aula"("id_aula") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_sesion" ADD CONSTRAINT "horario_sesion_dia_fk" FOREIGN KEY ("id_dia") REFERENCES "dia_semana"("id_dia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_sesion" ADD CONSTRAINT "horario_sesion_bloque_fk" FOREIGN KEY ("id_bloque") REFERENCES "bloque_horario"("id_bloque") ON DELETE CASCADE ON UPDATE CASCADE;
