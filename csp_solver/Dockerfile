FROM python:3.11-slim

WORKDIR /app

# Pre-instalar numpy y protobuf con versiones compatibles con Python 3.11
RUN pip install --no-cache-dir numpy==1.26.4 protobuf==4.25.3

# Instalar ortools primero (paquete pesado ~21MB, timeout extendido)
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=180 ortools==9.7.2996

# Instalar resto de dependencias
RUN pip install --no-cache-dir --timeout=120 -r requirements.txt

# Copiar el codigo fuente
COPY main.py .

# Exponer el puerto de FastAPI
EXPOSE 8000

# Comando para ejecutar el servidor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
