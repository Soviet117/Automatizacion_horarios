-- CreateTable
CREATE TABLE "configuracion_csp" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "dias_por_semana" INTEGER NOT NULL DEFAULT 5,
    "bloques_por_dia" INTEGER NOT NULL DEFAULT 8,
    "horas_max_por_profesor" INTEGER NOT NULL DEFAULT 40,
    "timeout_segundos" INTEGER NOT NULL DEFAULT 60,
    "modo_relajado" BOOLEAN NOT NULL DEFAULT false,
    "sesiones_max_por_dia_profesor" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_csp_pkey" PRIMARY KEY ("id")
);
