# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:lts AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The generated API client (src/app/core/api/generated) is committed to the
# repo rather than regenerated here: a Docker build has no reliable network
# path to a live backend, so `npm run generate:api` is a dev-time/CI step run
# against a running backend, with the resulting diff committed.
RUN npm run build

# ---- Runtime stage ----
FROM node:lts-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/ecommerce-frontend/server/server.mjs"]
