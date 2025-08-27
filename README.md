# Neufin - Sentiment-Driven Market Intelligence Platform

A production-ready retail investor platform providing real-time sentiment analysis and market intelligence.

## Features

- **Multi-Asset Portfolio Management**: Stocks, ETFs, Crypto, Commodities, Forex
- **Real-Time Market Data**: Integration with Yahoo Finance and Alpha Vantage APIs
- **AI-Powered Sentiment Analysis**: OpenAI-driven news sentiment scoring
- **Alpha Signal Generation**: Proprietary scoring algorithms combining sentiment, volatility, and momentum
- **Dark Theme Dashboard**: Modern, responsive UI with functional navigation

## Deployment on Render

### Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push this code to your GitHub repository
3. **API Keys**: Obtain the following API keys:
   - OpenAI API Key (required for sentiment analysis)
   - Alpha Vantage API Key (optional, fallback to Yahoo Finance)

### Deployment Steps

1. **Connect Repository**:
   - In Render dashboard, click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` configuration

2. **Environment Variables**:
   The following environment variables will be automatically configured:
   - `NODE_ENV`: Set to `production`
   - `JWT_SECRET`: Auto-generated secure token
   - `DATABASE_URL`: Auto-configured PostgreSQL connection
   
   You need to manually add:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `ALPHA_VANTAGE_API_KEY`: Your Alpha Vantage API key (optional)

3. **Build Process**:
   - Frontend: Built with Vite (React + TypeScript)
   - Backend: Built with ESBuild targeting production server
   - Static assets: Served from `dist/public/`
   - Production server: Runs without Vite dependencies

3. **Database Setup**:
   - PostgreSQL database will be automatically provisioned
   - Database schema will be created during first deployment

4. **Deploy**:
   - Click "Deploy" in the Render dashboard
   - Deployment typically takes 3-5 minutes
   - Your app will be available at `https://your-app-name.onrender.com`

### Configuration Files

- `render.yaml`: Render deployment configuration
- `Dockerfile`: Container configuration for deployment
- `.dockerignore`: Files to exclude from Docker build
- `.gitignore`: Files to exclude from version control

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Health Check

The application includes a health check endpoint at `/api/health` for monitoring deployment status.

### Database Management

Database schema is managed through Drizzle ORM:
```bash
# Push schema changes to database
npm run db:push
```

## Technology Stack

- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication
- **External APIs**: OpenAI, Yahoo Finance, Alpha Vantage

## Support

For deployment issues, check:
1. Render build logs for any compilation errors
2. Application logs for runtime errors
3. Database connection status
4. API key configuration

The application is designed to be deployment-ready with minimal configuration required.