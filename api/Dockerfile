# --- Fáze 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

# Čistá instalace
RUN npm ci
RUN npx prisma generate

COPY . .

# Zkompilování NestJS (TypeScript -> JavaScript)
RUN npm run build

# --- Fáze 2: Produkce ---
FROM node:22-alpine

# Alpine linux občas potřebuje doinstalovat openssl pro Prismu
RUN apk add --no-cache openssl

WORKDIR /app

# Zkopírujeme jen to nejnutnější z první fáze
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Otevření portu
EXPOSE 3000

# Spuštění produkčního serveru
CMD ["node", "dist/src/main.js"]
