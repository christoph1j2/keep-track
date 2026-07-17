# --- Fáze 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instalace závislostí
COPY package*.json ./
RUN npm ci

# Zkopírování zdrojových kódů a kompilace (předpokládám Vite)
COPY . .

ENV VITE_API_URL=/keeptrack/api
ENV VITE_SOCKET_PATH=/keeptrack/socket.io

RUN npm run build

# --- Fáze 2: Nginx (Servírování) ---
FROM nginx:alpine

# Smazání výchozího obsahu Nginxu a zkopírování naší React aplikace
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html/keeptrack/
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
