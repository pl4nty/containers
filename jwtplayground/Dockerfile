FROM node:24.11.1
WORKDIR /app

ENV NODE_ENV production
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD [ "node", "./bin/www" ]
EXPOSE 8080
