FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY src ./src

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (r) => {if(r.statusCode !== 200) throw new Error(r.statusCode)})"

ENV NODE_ENV=production \
    PORT=3005 \
    DB_HOST=postgres \
    DB_PORT=5432 \
    DB_NAME=ecotrack \
    DB_USER=postgres \
    REDIS_HOST=redis \
    REDIS_PORT=6379 \
    LOG_LEVEL=info

CMD ["npm", "start"]
