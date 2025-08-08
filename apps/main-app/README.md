# App V1 - Baskt Landing Page & Baskt Creation

This is a modern landing page and baskt creation application for the Baskt protocol, built with Next.js 15, TypeScript, and Tailwind CSS. It serves as both a marketing site and a functional baskt creation platform.

## Project Structure

### Root Directory

```
app_v1/
├── .next/                 # Next.js build output
├── node_modules/          # Dependencies
├── public/               # Static assets
├── src/                  # Source code
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── next.config.js        # Next.js configuration
├── next-env.d.ts         # Next.js TypeScript definitions
└── .gitignore           # Git ignore rules
```

### Source Code (`src/`)

#### `app/` - Next.js App Router

- **`layout.tsx`** - Root layout with providers and global styles
- **`page.tsx`** - Home page with landing page components
- **`create-baskt/page.tsx`** - Create baskt page with multi-step form

#### `components/` - React Components

**`home/`** - Landing page components:

- **`Hero.tsx`** - Main hero section with call-to-action
- **`Features.tsx`** - Features showcase with icons and descriptions
- **`Stats.tsx`** - Statistics display with animated counters
- **`HowItWorks.tsx`** - How it works section with step-by-step guide
- **`FeaturedBaskts.tsx`** - Featured baskts showcase with cards
- **`CallToAction.tsx`** - Call to action section

**`shared/`** - Reusable components:

- **`Navbar.tsx`** - Navigation bar with wallet connection
- **`Footer.tsx`** - Footer component with links and social media

**`create-baskt/`** - Create baskt components:

- **`CreateBasktForm.tsx`** - Multi-step baskt creation form
- **`AssetSelectionModal.tsx`** - Modal for selecting assets
- **`errorState/ErrorState.tsx`** - Error state component

**`create-baskt/createBasktSteps/`** - Step components:

- **`Step1BasicInfo.tsx`** - Basic info form (name, visibility, rebalancing)
- **`Step2Assets.tsx`** - Asset selection and configuration
- **`Step3Review.tsx`** - Final review and creation

**`create-baskt/assetModal/`** - Asset modal components:

- **`AssetCard.tsx`** - Individual asset card component
- **`AssetModalHeader.tsx`** - Modal header with search
- **`AssetModalFooter.tsx`** - Modal footer with actions
- **`AssetGrid.tsx`** - Grid layout for assets
- **`AssetSearch.tsx`** - Search functionality for assets
- **`AssetSkeleton.tsx`** - Loading skeleton for assets
- **`AssetLogo.tsx`** - Asset logo component
- **`SelectedAssetChip.tsx`** - Selected asset chip component

**`baskt/`** - Baskt-related components:

- **`BasktCards.tsx`** - Baskt card components for display

#### `hooks/` - Custom React Hooks

**`createBaskt/`** - Create baskt hooks:

- **`useCreateBasktForm.ts`** - Main form management hook
- **`createBasktSteps/useStep1BasicInfo.ts`** - Step 1 form logic
- **`createBasktSteps/useStep2Assets.ts`** - Step 2 assets logic
- **`createBasktSteps/useStep3Review.ts`** - Step 3 review logic

**`assetModal/`** - Asset modal hooks:

- **`useAssetSelection.ts`** - Asset selection and management

**`baskts/`** - Baskt-related hooks:

- **`useBasktOI.ts`** - Baskt open interest hook

**`wallet/`** - Wallet hooks:

- **`useWallet.ts`** - Wallet connection and management

#### `types/` - TypeScript Type Definitions

- **`navbar.ts`** - Navbar related types
- **`create-baskt.ts`** - Create baskt form and baskt configuration types
- **`baskt.ts`** - Baskt-related types
- **`asset.ts`** - Asset-related types and interfaces

#### `constants/` - Application Constants

- **`navigation.ts`** - Navigation configuration with icons
- **`create-baskt.ts`** - Create baskt form constants and validation rules

#### `routes/` - Application Routes

- **`route.ts`** - Route constants (EXPLORE, PORTFOLIO, VAULT)

#### `utils/` - Utility Functions

- **`create-baskt.ts`** - Baskt creation validation, formatting, and asset configuration utilities

#### `lib/` - Library Utilities

- **`trpc.ts`** - tRPC client configuration
- **`profanity.ts`** - Profanity checking utility

#### `providers/` - React Context Providers

- **`backend.tsx`** - Backend provider for API integration

#### `styles/` - Styling

- **`globals.css`** - Global CSS styles with Tailwind directives

### Public Assets (`public/`)

- **`favicon.ico`** - Favicon
- **`favicon.svg`** - SVG favicon
- **`logo.png`** - Application logo

## Features

### Implemented

#### Landing Page Features

- **Hero Section**: Eye-catching hero with gradient backgrounds and call-to-action
- **Features Showcase**: Highlighted features with icons and descriptions
- **Statistics Display**: Animated counters showing platform metrics
- **How It Works**: Step-by-step guide explaining the process
- **Featured Baskts**: Showcase of popular baskts with performance data
- **Call to Action**: Clear next steps for users

#### Baskt Creation Features

- **Multi-Step Form**: 3-step process for creating baskts
  - Step 1: Basic info (name, visibility, rebalancing settings)
  - Step 2: Asset selection and configuration (weights, positions)
  - Step 3: Review and creation
- **Asset Selection Modal**: Comprehensive asset picker with search and filtering
- **Real-time Validation**: Form validation with error messages
- **Profanity Detection**: Prevents inappropriate baskt names
- **Responsive Design**: Mobile-friendly interface
- **Weight Management**: Ensures total weight equals 100%
- **Position Selection**: Long/Short position configuration

#### Technical Features

- **Wallet Integration**: Solana wallet connection via Privy
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Stack**: Next.js 15, TypeScript, Tailwind CSS
- **Animation**: Framer Motion for smooth transitions
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Skeleton components and loading indicators

### Missing Features (Compared to main-app and admin-app)

#### Core Functionality

- **Dashboard**: No dashboard page or components
- **Baskt Management**: Baskt creation only, no editing/deletion
- **Pool Management**: No pool-related functionality
- **User Authentication**: Basic wallet connection only
- **Order Management**: No order creation or management
- **Position Management**: No position tracking
- **Access Control**: No access code functionality
- **Trading Interface**: No trading functionality

#### Pages & Routes

- **Explore**: `/explore` - Asset exploration
- **Portfolio**: `/portfolio` - User portfolio management
- **Vault**: `/vaults` - Vault management
- **Dashboard**: `/dashboard` - User dashboard
- **Baskt Details**: `/baskts/[name]` - Individual baskt pages

## Dependencies

### Core Dependencies

- **Next.js 15**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

### Baskt Ecosystem

- **@baskt/querier**: Data querying utilities
- **@baskt/sdk**: SDK for blockchain interactions
- **@baskt/types**: Shared type definitions
- **@baskt/ui**: UI component library
- **@baskt/backend**: Backend services

### Blockchain & Web3

- **@coral-xyz/anchor**: Solana program interaction
- **@solana/web3.js**: Solana blockchain client
- **@solana/spl-token**: Token handling
- **@privy-io/react-auth**: Web3 authentication

### Development & Utilities

- **@tanstack/react-query**: Data fetching and caching
- **@trpc/client**: Type-safe API client
- **@hookform/resolvers**: Form validation
- **zod**: Schema validation
- **sonner**: Toast notifications
- **leo-profanity**: Profanity detection
- **clsx**: Conditional class names
- **tailwind-merge**: Tailwind class merging

### Charts & Data Visualization

- **lightweight-charts**: Trading charts
- **recharts**: Data visualization
- **react-resizable-panels**: Resizable UI panels

## Purpose

This app serves as a comprehensive landing page and baskt creation platform for the Baskt protocol. It's designed to:

- **Introduce users** to the Baskt concept through an engaging landing page
- **Showcase features** and benefits with modern UI/UX
- **Enable baskt creation** through a streamlined multi-step process
- **Provide wallet integration** for blockchain interactions
- **Guide users** from discovery to action

## Comparison with Other Apps

| Feature            | app_v1 | main-app | admin-app |
| ------------------ | ------ | -------- | --------- |
| Landing Page       | Yes    | No       | No        |
| Baskt Creation     | Yes    | Yes      | Yes       |
| Dashboard          | No     | Yes      | Yes       |
| Baskt Management   | No     | Yes      | Yes       |
| Pool Management    | No     | Yes      | Yes       |
| Trading Interface  | No     | Yes      | No        |
| Admin Features     | No     | No       | Yes       |
| Authentication     | Yes    | Yes      | Yes       |
| Wallet Integration | Yes    | Yes      | Yes       |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

The app will be available at `http://localhost:3000`

## Key Features

### Landing Page

- **Modern Design**: Gradient backgrounds, smooth animations
- **Responsive Layout**: Works perfectly on all devices
- **Clear Value Proposition**: Explains Baskt benefits clearly
- **Call-to-Action**: Guides users to create their first baskt

### Baskt Creation

- **Step-by-Step Process**: 3 clear steps for easy navigation
- **Asset Selection**: Comprehensive modal with search and filtering
- **Real-time Validation**: Immediate feedback on form inputs
- **Weight Management**: Ensures proper asset allocation
- **Position Configuration**: Long/Short position selection
- **Profanity Protection**: Prevents inappropriate names
- **Mobile Responsive**: Optimized for mobile devices

### Technical Excellence

- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized with Next.js 15 and Turbopack
- **Error Handling**: Comprehensive error states
- **Loading States**: Smooth loading experiences
- **Accessibility**: WCAG compliant components

## Design System

The app uses a consistent design system with:

- **Color Palette**: Purple/violet gradients with dark theme
- **Typography**: Modern, readable fonts
- **Components**: Reusable UI components from @baskt/ui
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first design approach

## Development Notes

- **Modern Stack**: Uses the latest Next.js 15 with App Router
- **Type Safety**: Full TypeScript implementation
- **Component Architecture**: Well-organized component structure
- **Hook Pattern**: Custom hooks for business logic
- **Error Boundaries**: Proper error handling throughout
- **Performance**: Optimized with code splitting and lazy loading

This app provides a solid foundation for user acquisition and baskt creation, serving as both a marketing tool and a functional platform for creating baskts.
