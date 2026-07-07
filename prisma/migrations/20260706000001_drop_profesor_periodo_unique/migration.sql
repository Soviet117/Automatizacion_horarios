-- Drop the unique constraint AND index that prevented teachers from having multiple courses in the same period
ALTER TABLE "asignacion" DROP CONSTRAINT IF EXISTS "asignacion_profesor_periodo_uq";
DROP INDEX IF EXISTS "asignacion_profesor_periodo_uq";
