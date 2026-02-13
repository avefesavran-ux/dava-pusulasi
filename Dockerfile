# Stage 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
# Clean install
RUN npm ci || npm install
COPY . .

# Build-time environment variables
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Önce klasörü kontrol et, sonra build al, sonra klasör nerede bak
RUN npm run build && ls -la

# Stage 2: Serve
FROM nginx:alpine

# EĞER VITE İSE 'dist', CREATE REACT APP İSE 'build' klasörünü kopyalar. 
# Hata almamak için önce hangisi varsa onu kopyalayacak şekilde ayarladım:
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
