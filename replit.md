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
- **Token System**: Reward mechanism for user engagement, referrals, and rewarded advertisements
- **Coupon Marketplace**: Token redemption system for partner discounts
- **Product Search**: Full-text search across product database
- **Rewarded Ads**: Users can watch 30-second advertisements to earn 100 tokens, up to 1 ad per day

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

# Mobile Deployment

## Capacitor Integration (September 30, 2025)
- **Platform**: Capacitor 7.4.3 for iOS and Android deployment
- **App ID**: com.virtusgreen.app
- **Native Plugins**: 6 plugins installed
  - Camera (barcode scanning)
  - Preferences (local storage)
  - Push Notifications (with APNs/FCM setup guide)
  - Splash Screen
  - Status Bar
  - Share (native share functionality)
- **Documentation**: Complete deployment guides for App Store and Google Play submission
- **Assets**: Mobile app icon and splash screen generation guide provided
- **Status**: Production-ready for app store submission

## Build Commands
```bash
npm run build              # Build web app
npx cap sync              # Sync to mobile platforms
npx cap open ios          # Open Xcode (Mac only)
npx cap open android      # Open Android Studio
```

## Documentation Files
- `MOBILE_DEPLOYMENT_GUIDE.md` - Complete App Store and Google Play submission guide
- `resources/MOBILE_ASSETS_GUIDE.md` - Icon and splash screen creation guide
- `capacitor.config.ts` - Main Capacitor configuration

# Recent Changes

## September 30, 2025
- **Rewarded advertisements feature**: Users can now watch 30-second ads to earn 100 tokens each, with a daily limit of 1 ad (100 tokens/day max)
  - New database table: `adViews` to track ad viewing history
  - Backend API endpoints: POST /api/watch-ad and GET /api/ad-stats
  - Watch Ads page with real-time progress tracking and stats display
  - Accessible via "Watch Ads" menu item in profile dropdown
- **PayPal donation integration**: Added "Buy Me a Coffee" support page with PayPal and crypto wallet options
- **Mobile app deployment ready**: Integrated Capacitor 7.4.3 for iOS and Android with complete deployment documentation
- **Native features configured**: 6 plugins installed including camera, push notifications, and native sharing
- **App store preparation**: Created comprehensive guides for App Store and Google Play submission

## September 29, 2025
- **Fixed referral tracking system**: Resolved critical issue where local auth users (email/password registration) were getting referral tokens but referral events weren't being recorded in the database
- **Backfilled missing data**: Added missing referral events and token earnings history for existing users who had used referral codes
- **Enhanced referral validation**: Improved EVM wallet and Telegram verification with better input validation and duplicate prevention
- **Completed gamification features**: All social sharing, verification systems, and abuse prevention mechanisms are now fully functional