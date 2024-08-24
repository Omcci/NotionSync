FROM node:18-alpine as base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Development stage
FROM base as dev
CMD npm run dev

# Production stage
FROM base as prod
RUN npm run build
CMD npm run start