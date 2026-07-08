-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "avatar_url" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "notificacion" (
    "id_notificacion" VARCHAR NOT NULL,
    "id_usuario" VARCHAR NOT NULL,
    "tipo" VARCHAR NOT NULL,
    "mensaje" VARCHAR NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "link" VARCHAR,
    "creado_el" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pk" PRIMARY KEY ("id_notificacion")
);

-- CreateTable
CREATE TABLE "verificacion_pendiente" (
    "email" TEXT NOT NULL,
    "codigo" VARCHAR NOT NULL,
    "expiracion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verificacion_pendiente_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE INDEX "notificacion_id_usuario_idx" ON "notificacion"("id_usuario");

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
