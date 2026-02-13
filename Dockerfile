# Stage 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Build-time environment variables
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Stage 2: Serve
# ... (Build aşaması aynı kalsın) ...

FROM nginx:alpine
# Mevcut varsayılan konfigürasyonları tamamen temizleyelim
RUN rm /etc/nginx/conf.d/default.conf

# Derlenmiş dosyaları kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# Kendi konfigürasyonumuzu kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
