# Stage 1: Build dell'applicazione
FROM node:current-alpine3.22 AS builder

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di configurazione delle dipendenze
COPY package*.json ./
COPY tsconfig* .
COPY vite* .
COPY src ./src
COPY public/ ./public/
COPY index.html ./

# Debug: verifica struttura directory
RUN echo "=== Directory structure ===" && \
    ls -la && \
    echo "=== Source directory ===" && \
    ls -la src/ && \
    echo "=== TypeScript configs ===" && \
    ls -la tsconfig* && \
    echo "=== Files copied ===" > /tmp/debug.log && \
    find . -type f -name "*.json" >> /tmp/debug.log && \
    cat /tmp/debug.log

# Installa le dipendenze
RUN npm ci

# Build dell'applicazione per la produzione
RUN npm run build

RUN echo "Directory structure after build" && ls -la

# Stage 2: Serve dell'applicazione con Nginx
FROM nginx:alpine

# Copia i file buildati dal stage precedente
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia la configurazione personalizzata di Nginx (opzionale)
# COPY nginx.conf /etc/nginx/nginx.conf

# Esponi la porta 80
EXPOSE 80

# Comando di avvio (Nginx si avvia automaticamente)
CMD ["nginx", "-g", "daemon off;"]