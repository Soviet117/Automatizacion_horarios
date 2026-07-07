-- AlterTable
ALTER TABLE "escenario" ADD COLUMN     "id_ciclo" INTEGER,
ADD COLUMN     "id_plan" VARCHAR;

-- AddForeignKey
ALTER TABLE "escenario" ADD CONSTRAINT "escenario_ciclo_fk" FOREIGN KEY ("id_ciclo") REFERENCES "ciclo"("id_ciclo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escenario" ADD CONSTRAINT "escenario_plan_estudio_fk" FOREIGN KEY ("id_plan") REFERENCES "plan_estudio"("id_plan") ON DELETE SET NULL ON UPDATE CASCADE;
