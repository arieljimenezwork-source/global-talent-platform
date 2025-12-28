# Base Node + Debian slim
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

# 1) Sistema: Python + venv + LibreOffice + fuentes + ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    libreoffice libreoffice-writer \
    fonts-dejavu fonts-liberation fonts-noto \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2) Crear y activar virtualenv para evitar el error "externally-managed"
RUN python3 -m venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

# 3) Python deps (aprovecha cache copiando solo requirements primero)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# 4) Node deps (aprovecha cache)
COPY package*.json ./
RUN npm install --omit=dev
# 5) Código fuente completo
COPY . .

# 6) (Opcional) pasa la ruta del binario de Python a tu app Node
ENV PYTHON_BIN=python

# 7) Puerto expuesto y comando de arranque
EXPOSE 10000
CMD ["node", "index.js"]

