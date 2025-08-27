# Overview

Neufin is a retail investor platform that provides real-time sentiment-driven market intelligence. This is a full-stack web application designed to help retail investors make informed decisions by combining stock market data with sentiment analysis and proprietary alpha scoring algorithms. The platform features a modern dark-themed dashboard that displays portfolio performance, watchlists, market sentiment trends, and actionable investment signals.

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
- Sentiment analysis service using OpenAI API for news sentiment scoring
- Alpha signature service that combines sentiment, volatility, and momentum into proprietary scoring algorithms
- Authentication middleware using JWT tokens for secure user sessions

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database schema includes tables for users, portfolio holdings, watchlist items, sentiment data, alpha signatures, and stock prices. Neon is used as the PostgreSQL provider for serverless database hosting.

Database relationships are properly defined with foreign key constraints and cascading deletes. The schema uses UUIDs for primary keys and includes proper indexing for performance optimization.

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

The application is configured for deployment on Replit with specific build scripts and environment variable management for different deployment environments.