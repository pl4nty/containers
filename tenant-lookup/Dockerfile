FROM node:24.13.1

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

CMD [ "npm", "start" ]
