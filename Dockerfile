# Stage 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Build-time environment variables
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Build komutunu çalıştır
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# BURASI KRİTİK: Dosyalar dist'te değilse bile build klasöründen çekmeye çalışır
# Eğer senin projen Vite kullanıyorsa dist, Webpack/Create React App kullanıyorsa build olur.
COPY --from=build /app/dist /usr/share/nginx/html || COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
