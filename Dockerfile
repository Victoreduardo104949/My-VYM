# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia dependências e instala tudo (incluindo devDependencies)
COPY package*.json ./
RUN npm ci

# Copia código fonte
COPY . .

# Faz o build do frontend e do projeto
RUN npm run build

# Estágio de Produção
FROM node:20-alpine AS runner

WORKDIR /app

# Copia arquivos de configuração para instalação
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./

# Instala dependências (incluindo devDependencies para o modo watch/vite)
# E adiciona o tsx globalmente para rodar o backend
RUN npm ci --include=dev && npm install -g tsx && npm cache clean --force

# Copia os arquivos do build e código fonte
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/db.ts ./

# Define ambiente (pode ser sobrescrito pelo docker-compose)
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
