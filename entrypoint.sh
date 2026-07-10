#!/bin/sh

set -e

if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js no está instalado"
    exit 1
fi

echo "Generando Prisma Client..."
if prisma generate; then
    echo "Prisma Client generado exitosamente"
else
    echo "Error al generar Prisma Client"
    exit 1
fi

echo "Aplicando migraciones..."
if prisma migrate deploy; then
    echo "Migraciones aplicadas exitosamente"
else
    echo "Error al aplicar migraciones"
    exit 1
fi

if command -v python3 >/dev/null 2>&1; then
    echo "Iniciando CSP Solver en puerto 8000..."
    cd /app/csp_solver
    python3 -u main.py &
    CSP_PID=$!
    cd /app

    sleep 2

    if kill -0 $CSP_PID 2>/dev/null; then
        echo "CSP Solver iniciado correctamente (PID: $CSP_PID)"
    else
        echo "ADVERTENCIA: CSP Solver no pudo iniciarse."
    fi
fi

exec "$@"
