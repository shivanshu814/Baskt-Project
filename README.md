# Baskt Monorepo

This is a monorepo containing Baskt packages:

- `@baskt/program` - Solana program
- `@baskt/sdk` - SDK for interacting with the program

## Prerequisites

- Node.js (>=16.0.0)
- pnpm (>=8.0.0)
- Anchor (for Solana development)

## Setup

```bash
# Install dependencies
pnpm install
```

## Development

```bash
# Build all packages in correct order
pnpm build

# Run development mode (watch)
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Clean build artifacts
pnpm clean
```

## Package Structure

- `packages/program` - Solana program with Anchor
- `packages/sdk` - TypeScript SDK for interacting with the program

## Working with Packages

All packages are local and not published to npm. They use workspace references, so you can import them directly:

```typescript
import { MyClient } from '@baskt/sdk';
```

## Build Process

The build process follows a specific order:

1. First, the `program` package is built
2. Then, the `sdk` package is built

This ensures dependencies are properly built before packages that depend on them. 