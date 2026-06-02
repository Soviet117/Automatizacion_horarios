-- AlterTable
CREATE SEQUENCE ciclo_id_ciclo_seq;
ALTER TABLE "ciclo" ALTER COLUMN "id_ciclo" SET DEFAULT nextval('ciclo_id_ciclo_seq');
ALTER SEQUENCE ciclo_id_ciclo_seq OWNED BY "ciclo"."id_ciclo";
