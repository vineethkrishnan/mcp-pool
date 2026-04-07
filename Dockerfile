# Dockerfile for running MCP servers from the mcp-pool monorepo.
# Bridges stdio transport to Streamable HTTP via supergateway.
#
# Build args:
#   PACKAGE - the package directory name (e.g., stripe, sentry, notion)
#   PORT    - the port to expose (default: 8000)
#
# Example:
#   docker build --build-arg PACKAGE=stripe -t mcp-pool-stripe .
#   docker run -e STRIPE_SECRET_KEY=sk_... -p 8000:8000 mcp-pool-stripe

# ===========================================================================
# Stage 1: Build
# ===========================================================================
FROM node:20-slim AS build

ARG PACKAGE

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy oauth-core (shared dependency) and target package
COPY packages/oauth-core/ packages/oauth-core/
COPY packages/${PACKAGE}/ packages/${PACKAGE}/

# Install all dependencies (including dev for build)
RUN npm ci --workspace=packages/oauth-core --workspace=packages/${PACKAGE} --include-workspace-root

# Build oauth-core first (shared dependency), then the target package
RUN npm run build --workspace=packages/oauth-core 2>/dev/null; \
    npm run build --workspace=packages/${PACKAGE}

# ===========================================================================
# Stage 2: Production
# ===========================================================================
FROM node:20-slim

ARG PACKAGE
ARG PORT=8000

ENV NODE_ENV=production
ENV PORT=${PORT}

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy built oauth-core and target package
COPY --from=build /app/packages/oauth-core/ packages/oauth-core/
COPY --from=build /app/packages/${PACKAGE}/ packages/${PACKAGE}/

# Install production dependencies only + supergateway for stdio-to-HTTP bridge
RUN npm ci --workspace=packages/oauth-core --workspace=packages/${PACKAGE} --include-workspace-root --omit=dev --ignore-scripts && \
    npm install -g supergateway

# Persist the package name for the entrypoint
ENV MCP_PACKAGE=${PACKAGE}

# Run as non-root user
RUN groupadd -r mcp && useradd -r -g mcp mcp
USER mcp

EXPOSE ${PORT}

CMD ["sh", "-c", "supergateway --stdio \"node packages/${MCP_PACKAGE}/build/index.js\" --port ${PORT} --outputTransport streamableHttp"]
