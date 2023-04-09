FROM node:19
WORKDIR /usr/src/app

COPY package*.json .
RUN npm ci --omit=dev

COPY . .

EXPOSE 8080
CMD [ "node", "./bin/www" ]
