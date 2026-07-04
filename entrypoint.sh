#!/bin/sh
set -e

echo "=== Inicializando el sistema ==="

npx prisma generate

npx prisma migrate deploy

echo "Verificando si es primera ejecucion..."
COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.facultad.count().then(c => { console.log(c); p.\$disconnect(); }).catch(() => { console.log('0'); p.\$disconnect(); });
")

if [ "$COUNT" = "0" ]; then
  echo "Primera ejecucion detectada - ejecutando seed..."
  npx prisma db seed
  echo "Seed completado."
else
  echo "Seed ya ejecutado previamente, saltando."
fi

echo "=== Inicio completado ==="

exec "$@"
