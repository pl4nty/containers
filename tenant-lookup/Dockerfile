FROM node:22.15.0

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

CMD [ "npm", "start" ]
