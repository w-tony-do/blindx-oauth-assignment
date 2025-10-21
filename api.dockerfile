FROM node:20-alpine AS base

FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
RUN npm i -g pnpm
WORKDIR /build
COPY . .
ENV CI=true
RUN pnpm install --frozen-lockfile
RUN pnpm run api:build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs
COPY --from=installer --chown=nodejs:nodejs /build/out ./
COPY --from=installer --chown=nodejs:nodejs /build/out/migrations ./migrations
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
