FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM httpd:2.4-alpine

COPY apache.conf /usr/local/apache2/conf/extra/app.conf
RUN echo "Include conf/extra/app.conf" >> /usr/local/apache2/conf/httpd.conf

COPY --from=build /app/dist /usr/local/apache2/htdocs/

EXPOSE 80

CMD ["httpd-foreground"]
