#!/bin/sh

# Configurar Bash para modo estricto
set -e

# Verificar si las herramientas necesarias están disponibles
if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js no está instalado"
    exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
    echo "ERROR: npx no está disponible"
    exit 1
fi

# Generar cliente Prisma
if npx prisma generate; then
    echo "✅ Prisma Client generado exitosamente"
else
    echo "❌ Error al generar Prisma Client"
    exit 1
fi

# Iniciar la aplicación Next.js
exec npx next dev --port 3000
