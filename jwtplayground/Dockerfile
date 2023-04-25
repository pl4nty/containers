FROM node:18
WORKDIR /usr/src/app

ENV NODE_ENV production
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD [ "node", "./bin/www" ]
EXPOSE 8080
