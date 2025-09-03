# Overview

Neufin is a retail investor platform that provides real-time sentiment-driven market intelligence. This is a full-stack web application designed to help retail investors make informed decisions by combining stock market data with sentiment analysis and proprietary alpha scoring algorithms. The platform features a modern dark-themed dashboard with functional navigation tabs, comprehensive portfolio management, manual data population capabilities, and real-time market data integration across multiple asset types (stocks, ETFs, crypto, commodities, forex).

## Recent Changes (September 2025)
- ✅ **ROBUST API FALLBACKS**: Added Anthropic Claude backup for AI chat when OpenAI quota exceeded
- ✅ **FINNHUB MARKET BACKUP**: Implemented Finnhub API as fallback for Alpha Vantage market data
- ✅ **REAL-TIME MARKET DATA**: Integrated Alpha Vantage API with live stock quotes and market trends
- ✅ **LIVE STOCK QUOTES**: Added /api/market/trends and /api/market/quote/:symbol endpoints with real financial data
- ✅ **MARKET STATUS**: Implemented market hours detection and Alpha Vantage API status monitoring
- ✅ **LOGIN SIMPLIFICATION**: Added demo account (demo@neufin.com / demo123) for easy access
- ✅ **EXPRESS MIDDLEWARE**: Added JSON body parser and simplified authentication endpoints
- ✅ **DEPLOYMENT COMPLETION**: Finalized comprehensive Render deployment fix with proper static file serving
- ✅ **DARK THEME RESTORATION**: Implemented forced dark theme with enhanced text visibility (95-98% white text)
- ✅ **TEXT CONTRAST FIX**: Made Dashboard title, Neufin logo, and all text elements clearly visible
- ✅ **BUILD OPTIMIZATION**: Frontend builds to client/dist, backend bundles with ESBuild for production
- ✅ **SERVER CONFIGURATION**: Created production-ready server.js with correct path resolution
- ✅ **CSS VARIABLES**: Enhanced color system with --color-text-heading (98% white) and --color-text-muted (75% white)
- ✅ Fixed OpenAI API compatibility issues (max_tokens → max_completion_tokens, removed temperature parameter)
- ✅ Added AI-powered chat widget for personalized investment advice and portfolio analysis
- ✅ Created market trend analysis widget with real-time bullish/bearish sentiment recommendations
- ✅ Built comprehensive behavioral bias analyzer with ML-based detection algorithms

## Deployment Status (September 2025)
- ✅ **FULLY READY**: Complete Render deployment configuration implemented and tested
- ✅ **DARK THEME ENFORCED**: Fixed all text visibility issues with comprehensive CSS overrides and !important declarations
- ✅ **EXPRESS SERVER**: Production-ready server.js correctly serves React frontend from client/dist
- ✅ **BUILD PROCESS**: Frontend builds to 938KB optimized bundle, backend bundles with ESBuild to 603b JavaScript
- ✅ **TYPESCRIPT RESOLVED**: Fixed all compilation errors with proper Express interface extension
- ✅ **STATIC FILE SERVING**: Corrected path resolution for client/dist structure in production
- ✅ **PORT CONFIGURATION**: Proper PORT environment variable handling for Render (10000 fallback)
- ✅ **HEALTH CHECKS**: /api/health endpoint configured for deployment monitoring
- 🚀 **DEPLOYMENT READY**: Application is fully prepared for immediate Render deployment

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React 18 using Vite as the build tool and bundler. The UI is constructed with shadcn/ui components built on top of Radix UI primitives, providing a consistent and accessible design system. TailwindCSS handles all styling with a custom dark theme configuration. The application uses wouter for client-side routing and TanStack Query for server state management with optimistic updates and caching.

The component structure follows a modular approach with separate directories for UI components, layout components, charts, and feature-specific components (portfolio, watchlist, alpha signals, news). Form handling is managed through react-hook-form with Zod schema validation for type safety.

## Backend Architecture
The backend is built with Express.js running on Node.js with TypeScript for type safety. The server follows a layered architecture pattern with separate modules for routes, services, storage, and middleware. The API provides RESTful endpoints for authentication, portfolio management, watchlist operations, market data, and sentiment analysis.

Key services include:
- Stock API service for real-time market data integration
- Sentiment analysis service using OpenAI GPT-5 for news sentiment scoring
- Alpha signature service that combines sentiment, volatility, and momentum into proprietary scoring algorithms
- Behavioral bias analyzer with rule-based and ML algorithms for detecting cognitive biases
- AI chat analysis service for personalized investment advice and portfolio insights
- Market trend analysis service providing bullish/bearish recommendations with confidence scoring
- Authentication middleware using JWT tokens for secure user sessions

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database schema includes tables for users, portfolio holdings, watchlist items, sentiment data, alpha signatures, stock prices, and behavioral analysis data. Neon is used as the PostgreSQL provider for serverless database hosting.

Database relationships are properly defined with foreign key constraints and cascading deletes. The schema uses UUIDs for primary keys and includes proper indexing for performance optimization. Behavioral analysis data includes transaction history tracking for bias detection algorithms.

## Authentication and Authorization
JWT-based authentication system handles user registration and login. Passwords are hashed using bcryptjs with salt rounds for security. The authentication middleware validates JWT tokens on protected routes and attaches user context to requests. Tokens are stored in localStorage on the client side with automatic inclusion in API requests.

## External Dependencies

### Third-party Services
- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI API**: Powers sentiment analysis of financial news using GPT-5
- **Stock Market APIs**: Polygon.io integration for real-time stock quotes and market data
- **Replit**: Development environment with specific plugins for runtime error handling and cartographer

### Key Libraries and Frameworks
- **React ecosystem**: React 18, Vite, TanStack Query, wouter routing
- **UI/Styling**: shadcn/ui, Radix UI, TailwindCSS, Lucide React icons
- **Backend**: Express.js, Drizzle ORM, bcryptjs, jsonwebtoken
- **Charts**: Recharts for data visualization
- **Form handling**: react-hook-form with Zod validation
- **Development tools**: TypeScript, ESBuild, PostCSS, Autoprefixer

### Database and ORM
- **PostgreSQL**: Primary database via Neon serverless
- **Drizzle ORM**: Type-safe database operations with schema management
- **Migration system**: Drizzle Kit for database schema versioning

The application is configured for deployment on both Replit and Render with specific build scripts, environment variable management, and production-ready configurations.

## Deployment Configuration

### Render Deployment
- **render.yaml**: Blueprint configuration for automatic deployment
- **Dockerfile**: Container configuration with multi-stage build
- **Health Check**: `/api/health` endpoint for monitoring
- **Database**: Auto-provisioned PostgreSQL with connection pooling
- **Environment**: Production-ready with proper PORT handling and static file serving

### Build Configuration
- **Production Build**: Vite frontend build + ESBuild backend bundle
- **Static Assets**: Properly served in production environment
- **Port Configuration**: Dynamic PORT environment variable support
- **Database Schema**: Drizzle ORM with push-based migrations