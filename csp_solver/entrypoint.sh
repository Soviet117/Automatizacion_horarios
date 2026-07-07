#!/bin/bash

set -e

echo "=== Lanzando el CSP Solver ==="

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "🔧 Creando entorno virtual..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📦 Instalando dependencias..."
pip install -r requirements.txt --quiet

echo "✅ Entorno preparado - Iniciando servidor FastAPI"
echo "🚀 Escuchando en http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"

exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
