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
# Install dependencies
pnpm install

# Build commands
pnpm build              # Build all packages
pnpm build:main        # Build main app only
pnpm build:admin       # Build admin app only
pnpm build:backend     # Build backend only
pnpm build:sdk         # Build SDK only
pnpm build:ui          # Build UI package only
pnpm build:program     # Build Solana program only
pnpm build:choose      # Interactive build menu

# Development commands
pnpm dev               # Run all packages in dev mode
pnpm dev:main         # Run main app (Port 3000)
pnpm dev:admin        # Run admin app (Port 3001)
pnpm dev:backend      # Run backend (Port 4000)
pnpm dev:sdk          # Run SDK in dev mode
pnpm dev:ui           # Run UI package in dev mode
pnpm dev:choose       # Interactive dev menu

# Testing commands
pnpm test             # Run all tests
pnpm test:main        # Test main app
pnpm test:admin       # Test admin app
pnpm test:backend     # Test backend
pnpm test:sdk         # Test SDK
pnpm test:ui          # Test UI package
pnpm test:program     # Test Solana program
pnpm test:choose      # Interactive test menu

# Linting commands
pnpm lint             # Lint all packages
pnpm lint:main        # Lint main app
pnpm lint:admin       # Lint admin app
pnpm lint:backend     # Lint backend
pnpm lint:sdk         # Lint SDK
pnpm lint:ui          # Lint UI package
pnpm lint:program     # Lint Solana program
pnpm lint:choose      # Interactive lint menu

# Format code
pnpm format           # Format all code using Prettier

# Clean build artifacts
pnpm clean            # Clean all build artifacts
```

## Package Structure

- `packages/program` - Solana program with Anchor
- `packages/sdk` - TypeScript SDK for interacting with the program

## Project Tree Structure

```
baskt-monorepo/
├── apps/
│   ├── admin-app/          # Admin dashboard application
│   │   ├── src/            # Source code
│   │   ├── .next/          # Next.js build output
│   │   └── package.json    # Dependencies and scripts
│   └── main-app/           # Main application
│       ├── src/            # Source code
│       ├── .next/          # Next.js build output
│       └── package.json    # Dependencies and scripts
├── packages/
│   ├── program/            # Solana program
│   │   ├── programs/       # Program source code
│   │   ├── tests/          # Program tests
│   │   ├── Anchor.toml     # Anchor configuration
│   │   └── Cargo.toml      # Rust dependencies
│   ├── sdk/                # TypeScript SDK
│   │   ├── src/            # SDK source code
│   │   ├── dist/           # Compiled SDK
│   │   └── package.json    # Dependencies and scripts
│   └── ui/                 # Shared UI components
│       ├── src/            # UI components
│       ├── dist/           # Compiled components
│       └── package.json    # Dependencies and scripts
├── backend/                # Backend service
│   ├── src/                # Backend source code
│   ├── dist/               # Compiled backend
│   └── package.json        # Dependencies and scripts
├── package.json            # Root package configuration
├── pnpm-workspace.yaml     # Workspace configuration
├── tsconfig.json           # TypeScript configuration
└── turbo.json              # Turborepo configuration
```

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

## Post-Build Address Verification

After building the program, it's important to verify that the program address is consistent across all files. Check these files for the same program address:

1. `packages/program/Anchor.toml` - Under `[programs.mainnet]` baskt_v1 field
2. `packages/program/programs/baskt_v1/src/lib.rs` - In `declare_id!()`
3. `packages/program/target/types/baskt_v1.ts` - In `address` field
4. `packages/program/target/types/baskt_v1.d.ts` - In `address` field
5. `packages/program/target/idl/baskt_v1.json` - In `address` field
6. `packages/sdk/src/program/types/baskt_v1.ts` - In `address` field
7. `packages/sdk/src/program/idl/baskt_v1.json` - In `address` field

If any address mismatches are found, copy the address from `Anchor.toml` and update it in all other files to ensure tests run correctly.

## Testing Framework

The project uses Mocha as the primary testing framework:

- **Test Runner**: `ts-mocha` for TypeScript support
- **Test Files Location**:
  - Program tests: `packages/program/tests/**/*.test.ts`
  - SDK tests: `packages/sdk/tests/**/*.test.ts`
  - Backend tests: `backend/tests/**/*.test.ts`

To run tests:

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test:program     # Run Solana program tests
pnpm test:sdk         # Run SDK tests
pnpm test:backend     # Run backend tests
```

Test configuration can be found in:

- `.mocharc.json` - Mocha configuration
- `tsconfig.json` - TypeScript configuration for tests
