# overrides the upstream Dockerfile (copied over the submodule at build time)
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install \
  # wasm-webterm falls back to registry.wapm.io for unknown commands, which now times out
  # after ~20s (HTTP 522). Answer its lookup with "no such command" so it fails immediately
  && sed -i 's#https://registry.wapm.io/graphql#data:application/json,%7B%22data%22%3A%7B%22command%22%3Anull%7D%7D#g' \
    node_modules/wasm-webterm/webterm.bundle.js \
  && npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/dist .
ENTRYPOINT ["nginx", "-g", "daemon off;"]
