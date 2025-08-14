# Ultra minimal production image - build happens outside Docker
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Create wallet directory for mounting
RUN mkdir -p /app/wallet

# Install only the external dependencies that tsup couldn't bundle
# Based on tsup.config.ts external array: pg, mongoose, sequelize, @vercel/blob
RUN npm install --production --no-save pg mongoose sequelize @vercel/blob

# Copy ONLY the pre-built JavaScript binary (built outside Docker)
COPY services/backend/dist/server/index.js ./server.js

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start the application directly with the bundled binary
CMD ["node", "server.js"]
