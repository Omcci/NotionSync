FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Development stage
FROM base AS dev
CMD npm run dev

# Production stage
FROM base AS prod
RUN npm run build
CMD npm run start
