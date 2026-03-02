# simple Node container for the intranet backend
# builds frontend (optional) and runs the Express server

FROM node:20-slim AS base
WORKDIR /app

# copy package manifests and install all dependencies (including dev)
# so that we can run the frontend build.  A later step prunes dev deps.
COPY package*.json ./
RUN npm ci

# copy the rest of the application code
COPY . .

# build frontend assets into /dist so Express can serve them in production
RUN npm run build

# remove development dependencies before passing to runtime stage
RUN npm prune --production

# runtime image (could reuse base but we keep it explicit)
FROM node:20-slim AS runtime
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
