FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile

COPY . .

RUN yarn prisma generate

ENV NODE_ENV=production