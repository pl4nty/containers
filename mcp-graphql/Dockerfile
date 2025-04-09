FROM oven/bun:1.2.9
WORKDIR /usr/src/app

COPY package*.json bun.lockb ./
RUN bun install --frozen-lockfile --production

COPY . .

USER bun
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
