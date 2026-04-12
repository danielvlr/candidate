# Multi-stage build para otimizar a imagem final

# Estágio 1: Build
FROM node:18-alpine AS builder

# Argumentos de build
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do npm
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Definir variáveis de ambiente para o build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build da aplicação
RUN npm run build

# Estágio 2: Servir com nginx
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]