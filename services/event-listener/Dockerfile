# Simple single-stage Dockerfile for @baskt/event-listener service
FROM node:20-alpine
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy package.json files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsup.base.config.ts tsconfig.json ./

COPY packages/types/package.json ./packages/types/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/querier/package.json ./packages/querier/
COPY packages/data-bus/package.json ./packages/data-bus/
COPY services/event-listener/package.json ./services/event-listener/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy workspace configuration
COPY packages/program/target/types/baskt.ts ./packages/program/target/types/baskt.ts  
COPY packages/program/target/idl/baskt.json ./packages/program/target/idl/baskt.json

# Copy source code for workspace packages
COPY packages/types/ ./packages/types/
COPY packages/sdk/ ./packages/sdk/
COPY packages/querier/ ./packages/querier/
COPY packages/data-bus/ ./packages/data-bus/

# Copy event-listener service source
COPY services/event-listener/ ./services/event-listener/

# Build workspace dependencies and event-listener service
RUN pnpm build:lib
WORKDIR /app/services/event-listener
RUN pnpm build
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Create wallet directory for mounted wallet file
RUN mkdir -p /app/wallet && chown nodejs:nodejs /app/wallet

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4002

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "console.log('Event listener service health check')"

# Start the application
CMD ["node", "services/event-listener/dist/listener.js"]
