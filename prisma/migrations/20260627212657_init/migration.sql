/*
  Warnings:

  - A unique constraint covering the columns `[id_docente,id_dia,id_bloque,id_periodo,id_escenario]` on the table `horario_sesion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_aula,id_dia,id_bloque,id_periodo,id_escenario]` on the table `horario_sesion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_asignacion,id_dia,id_bloque,tipo_sesion,id_escenario]` on the table `horario_sesion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "horario_sesion_asignacion_uq";

-- DropIndex
DROP INDEX "horario_sesion_aula_uq";

-- DropIndex
DROP INDEX "horario_sesion_docente_uq";

-- AlterTable
ALTER TABLE "ciclo" ALTER COLUMN "id_ciclo" DROP DEFAULT;
DROP SEQUENCE "ciclo_id_ciclo_seq";

-- AlterTable
ALTER TABLE "horario_sesion" ADD COLUMN     "id_escenario" VARCHAR;

-- CreateTable
CREATE TABLE "competencia_docente" (
    "id_docente" VARCHAR NOT NULL,
    "id_curso" VARCHAR NOT NULL,

    CONSTRAINT "competencia_docente_pk" PRIMARY KEY ("id_docente","id_curso")
);

-- CreateTable
CREATE TABLE "escenario" (
    "id_escenario" VARCHAR NOT NULL,
    "nom_escenario" VARCHAR NOT NULL,
    "descripcion" VARCHAR,
    "estado" VARCHAR NOT NULL,
    "cobertura" INTEGER NOT NULL DEFAULT 0,
    "conflictos" INTEGER NOT NULL DEFAULT 0,
    "creado_el" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" VARCHAR,

    CONSTRAINT "escenario_pk" PRIMARY KEY ("id_escenario")
);

-- CreateIndex
CREATE INDEX "competencia_docente_id_curso_idx" ON "competencia_docente"("id_curso");

-- CreateIndex
CREATE INDEX "competencia_docente_id_docente_idx" ON "competencia_docente"("id_docente");

-- CreateIndex
CREATE INDEX "horario_sesion_id_escenario_idx" ON "horario_sesion"("id_escenario");

-- CreateIndex
CREATE UNIQUE INDEX "horario_sesion_docente_uq" ON "horario_sesion"("id_docente", "id_dia", "id_bloque", "id_periodo", "id_escenario");

-- CreateIndex
CREATE UNIQUE INDEX "horario_sesion_aula_uq" ON "horario_sesion"("id_aula", "id_dia", "id_bloque", "id_periodo", "id_escenario");

-- CreateIndex
CREATE UNIQUE INDEX "horario_sesion_asignacion_uq" ON "horario_sesion"("id_asignacion", "id_dia", "id_bloque", "tipo_sesion", "id_escenario");

-- AddForeignKey
ALTER TABLE "horario_sesion" ADD CONSTRAINT "horario_sesion_escenario_fk" FOREIGN KEY ("id_escenario") REFERENCES "escenario"("id_escenario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencia_docente" ADD CONSTRAINT "competencia_docente_curso_fk" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencia_docente" ADD CONSTRAINT "competencia_docente_docente_fk" FOREIGN KEY ("id_docente") REFERENCES "docente"("id_docente") ON DELETE CASCADE ON UPDATE CASCADE;
