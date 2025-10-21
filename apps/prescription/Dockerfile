# Build stage
FROM node:20-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
# Replace <your-major-version> with the major version installed in your repository. For example:
# RUN yarn global add turbo@^2
RUN yarn global add turbo@^2
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune prescription --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN npm i -g pnpm
RUN pnpm install
# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=prescription

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Copy the built application
COPY --from=installer --chown=nodejs:nodejs /app/apps/prescription/out/index.js ./index.js

# Set production environment
ENV NODE_ENV=production

CMD ["node", "index.js"]
