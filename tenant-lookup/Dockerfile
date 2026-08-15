FROM node:24.19.0@sha256:934240a162082fd8b8a2f90cd5114446443f1eba1c5378f6687167ca405e6584

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

CMD [ "npm", "start" ]
