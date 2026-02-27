# simple Node container for the intranet backend
# builds frontend (optional) and runs the Express server

FROM node:20-alpine AS base
WORKDIR /app

# copy package manifests and install dependencies early to take advantage of caching
COPY package*.json ./
RUN npm ci --production

# copy the whole project so the server code (and frontend) is available
COPY . .

# build frontend assets into /dist so Express can serve them in production
RUN npm run build

# runtime image (could reuse base but we keep it explicit)
FROM node:20-alpine AS runtime
WORKDIR /app

# copy over node modules and built code
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/src ./src
COPY --from=base /app/server.js ./server.js
COPY --from=base /app/config.js ./config.js
COPY --from=base /app/db.js ./db.js
COPY --from=base /app/package*.json ./

# ensure directories exist and are writable (volumes may override)
RUN mkdir -p clientes data

ENV NODE_ENV=production
ENV PORT=3500
EXPOSE 3500

CMD ["node","server.js"]
