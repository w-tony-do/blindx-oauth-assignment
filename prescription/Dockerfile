FROM node:20-alpine AS base

FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
RUN npm i -g pnpm
WORKDIR /build
COPY . .
RUN pnpm install --frozen-lockfile

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs
COPY --from=installer --chown=nodejs:nodejs /build/apps/prescription/out ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "out/index.js"]
