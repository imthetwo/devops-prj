# Stage 1: Xây dựng (Builder)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Stage 2: Thực thi (Production)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --only=production && npm cache clean --force
COPY --from=builder /app .

# Cổng này phải khớp với cổng bên trong của Docker Compose (8081:8080)
EXPOSE 8080
CMD ["npm", "start"]