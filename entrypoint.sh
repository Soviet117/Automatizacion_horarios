#!/bin/sh

set -e

if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js no está instalado"
    exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
    echo "ERROR: npx no está disponible"
    exit 1
fi

if npx prisma generate; then
    echo "Prisma Client generado exitosamente"
else
    echo "Error al generar Prisma Client"
    exit 1
fi

if npx prisma migrate deploy; then
    echo "Migraciones aplicadas exitosamente"
else
    echo "Error al aplicar migraciones"
    exit 1
fi

exec "$@"
