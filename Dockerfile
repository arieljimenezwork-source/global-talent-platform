# Base Node + Debian slim
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 4) Node deps (aprovecha cache)
COPY package*.json ./
RUN npm install --omit=dev
# 5) Código fuente completo
COPY . .

# 7) Puerto expuesto y comando de arranque
EXPOSE 10000
CMD ["node", "index.js"]

