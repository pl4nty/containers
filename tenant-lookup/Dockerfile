FROM node:22.18.0

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

CMD [ "npm", "start" ]
