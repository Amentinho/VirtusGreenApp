# Overview

VirtusGreen is an eco-friendly product discovery platform that helps users make environmentally conscious purchasing decisions. Users can scan product barcodes or search for items to view detailed environmental impact metrics. The platform includes a token-based reward system where users earn tokens through referrals and can redeem them for coupons in the marketplace.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom shadcn/ui components for accessibility and consistency
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Framework**: Express.js server with TypeScript for API endpoints
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Session Storage**: Express sessions with configurable storage backend
- **Password Security**: Node.js crypto module with scrypt for secure password hashing
- **API Design**: RESTful endpoints for products, coupons, and user management
- **Request Logging**: Custom middleware for API request logging and monitoring

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Data Models**: Products with environmental impact metrics, users with token balances, and redeemable coupons

## Core Features
- **Barcode Scanning**: ZXing library for real-time barcode recognition via camera
- **Environmental Metrics**: Multi-dimensional scoring system for product sustainability
- **Token System**: Reward mechanism for user engagement and referrals
- **Coupon Marketplace**: Token redemption system for partner discounts
- **Product Search**: Full-text search across product database

## Authentication & Security
- **Session Management**: Secure session handling with configurable storage
- **Password Protection**: Industry-standard password hashing with salt
- **Route Protection**: Client-side route guards for authenticated areas
- **Form Validation**: Schema-based validation on both client and server

# External Dependencies

- **Database**: Neon serverless PostgreSQL for scalable data storage
- **UI Components**: Radix UI for accessible component primitives
- **Barcode Processing**: ZXing browser library for barcode scanning capabilities
- **Charting**: Victory charts for environmental impact data visualization
- **Development**: Replit-specific plugins for theme management and development tools

# Recent Changes

## September 29, 2025
- **Fixed referral tracking system**: Resolved critical issue where local auth users (email/password registration) were getting referral tokens but referral events weren't being recorded in the database
- **Backfilled missing data**: Added missing referral events and token earnings history for existing users who had used referral codes
- **Enhanced referral validation**: Improved EVM wallet and Telegram verification with better input validation and duplicate prevention
- **Completed gamification features**: All social sharing, verification systems, and abuse prevention mechanisms are now fully functional