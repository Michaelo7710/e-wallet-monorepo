# LAPIS 1: Tahap Pembangunan (Builder)
FROM node:18-alpine AS builder

# Set direktori kerja di dalam kontainer
WORKDIR /usr/src/app

# Salin file dependensi terlebih dahulu untuk optimasi caching Docker
COPY package*.json ./

# Install SEMUA dependensi (termasuk devDependencies untuk testing/linting)
RUN npm ci

# Salin seluruh sisa source code
COPY . .

# LAPIS 2: Tahap Produksi (Production - Clean Code)
FROM node:18-alpine

# Set environment ke production agar Express lebih ringan dan cepat
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Hanya salin file package.json dan hasil instalasi dari tahap builder
COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/server.js ./

# Turunkan hak akses dari 'root' ke user 'node' standar demi keamanan (Anti-Privilege Escalation)
USER node

# Ekspos port yang digunakan Express
EXPOSE 3000

# Perintah utama untuk menjalankan server
CMD ["node", "server.js"]