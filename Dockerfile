FROM node:22.20-alpine3.22

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node","app.js"]
