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

echo "Iniciando Next.js en puerto $PORT..."
"$@" &
NEXT_PID=$!

sleep 3

if kill -0 $NEXT_PID 2>/dev/null; then
    echo "Next.js iniciado correctamente (PID: $NEXT_PID)"
else
    echo "ERROR: Next.js no pudo iniciarse."
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

echo "Ambos servicios iniciados. Esperando..."

cleanup() {
    echo "Deteniendo servicios..."
    kill $NEXT_PID 2>/dev/null
    kill $CSP_PID 2>/dev/null
    wait $NEXT_PID 2>/dev/null
    wait $CSP_PID 2>/dev/null
    echo "Servicios detenidos."
}

trap cleanup TERM INT

wait $NEXT_PID $CSP_PID
