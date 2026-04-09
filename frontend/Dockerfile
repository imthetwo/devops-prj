# Stage 1: Build (Giữ nguyên như bạn đã viết)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve với Nginx (Xịn hơn và nhẹ hơn)
FROM nginx:stable-alpine
# Copy file đã build vào thư mục mặc định của Nginx
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]