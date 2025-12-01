FROM node:22.21.1

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

CMD [ "npm", "start" ]
