FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN for i in 1 2 3; do \
      npm ci --fetch-retries=3 --fetch-timeout=120000 && break || \
      (echo "Intento $i falló, reintentando en 10s..." && sleep 10); \
    done


FROM base AS dev

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "run", "dev"]


FROM base AS builder

COPY . .

RUN npm run build


FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=10000
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g prisma@6.19.3

COPY csp_solver/requirements.txt /app/csp_solver/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /app/csp_solver/requirements.txt

COPY csp_solver/main.py /app/csp_solver/main.py

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
