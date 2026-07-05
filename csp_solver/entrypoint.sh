#!/bin/bash

# Portal de desarrollo del solver CSP

set -e

echo "=== Lanzando el CSP Solver ==="

echo "🎯 Configurando entorno..."

cd /home/Soviet117/Documentos/proyecto-horario/csp_solver

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del solver..."
    npm install
fi

# Generar cliente Prisma
if npx prisma generate; then
    echo "✅ Prisma Client generado"
else
    echo "❌ Error al generar Prisma Client"
    exit 1
fi

# Instalar ortools si no está presente
if [ ! -d "node_modules/ortools" ]; then
    echo "🔧 Instalando ortools CP-SAT..."
    npm install ortools
fi

# Verificar Python y ortools están disponibles
if command -v python3 >/dev/null 2>&1; then
    echo "🐍 Python disponible"
else
    echo "⚠️ Python no está disponible, intentando instalar..."
    apt-get update && apt-get install -y python3 python3-pip
fi

pip3 install ortools 2>/dev/null || echo "⚠️ No se pudo instalar ortools, usando la instalación del sistema"

echo "✅ Entorno preparado - Iniciando servidor FastAPI"
echo "🚀 Escuchando en http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"

# Ejecutar el servidor
exec python3 -m pip install -r requirements.txt 2>/dev/null || true
exec python3 main.py
