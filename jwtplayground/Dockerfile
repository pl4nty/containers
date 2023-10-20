FROM node:21.0.0
WORKDIR /app

ENV NODE_ENV production
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD [ "node", "./bin/www" ]
EXPOSE 8080
