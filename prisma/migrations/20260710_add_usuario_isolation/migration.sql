-- AlterTable: Add id_usuario to 8 catalog models
ALTER TABLE "facultad" ADD COLUMN "id_usuario" VARCHAR;

ALTER TABLE "carrera" ADD COLUMN "id_usuario" VARCHAR;

ALTER TABLE "plan_estudio" ADD COLUMN "id_usuario" VARCHAR;

ALTER TABLE "ciclo" ADD COLUMN "id_usuario" VARCHAR;

ALTER TABLE "tipo_sesion" ADD COLUMN "id_usuario" VARCHAR;

ALTER TABLE "tipo_aula" ADD COLUMN "id_usuario" VARCHAR;

ALTER TABLE "periodo_academico" ADD COLUMN "id_usuario" VARCHAR;

ALTER TABLE "asignacion" ADD COLUMN "id_usuario" VARCHAR;

-- AddForeignKey: Facultad
ALTER TABLE "facultad" ADD CONSTRAINT "facultad_usuario_fk"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Carrera
ALTER TABLE "carrera" ADD CONSTRAINT "carrera_usuario_fk"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Plan_estudio
ALTER TABLE "plan_estudio" ADD CONSTRAINT "plan_estudio_usuario_fk"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Ciclo
ALTER TABLE "ciclo" ADD CONSTRAINT "ciclo_usuario_fk"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Tipo_sesion
ALTER TABLE "tipo_sesion" ADD CONSTRAINT "tipo_sesion_usuario_fk"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Tipo_aula
ALTER TABLE "tipo_aula" ADD CONSTRAINT "tipo_aula_usuario_fk"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Periodo_academico
ALTER TABLE "periodo_academico" ADD CONSTRAINT "periodo_academico_usuario_fk"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Asignacion
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_usuario_fk"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
