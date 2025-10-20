# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy shared packages
COPY packages ./packages

# Copy prescription app
COPY apps/prescription ./apps/prescription

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile

# Build shared packages and the prescription app
RUN pnpm run build --filter=prescription...

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy shared packages (source code needed for workspace references)
COPY packages ./packages

# Copy prescription app package.json
COPY apps/prescription/package.json ./apps/prescription/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/apps/prescription/dist ./apps/prescription/dist

# Copy built migration files to the dist folder
COPY --from=builder /app/apps/prescription/dist/libs/db/migrations ./apps/prescription/dist/libs/db/migrations

# Copy built shared packages if they have dist folders
COPY --from=builder /app/packages ./packages

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set working directory to the app
WORKDIR /app/apps/prescription

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })" || exit 1

# Start the application
CMD ["node", "dist/main.js"]
