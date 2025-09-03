# Dockerfile for Render deployment
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install backend dependencies 
RUN npm ci

# Copy source code
COPY . .

# Copy dependencies to client and build frontend, bundle backend
RUN cp -r node_modules client/ && cd client && npm run build && cd .. && npx esbuild server.js --bundle --platform=node --outfile=dist/server.js --format=esm --packages=external

# Remove dev dependencies after build but keep runtime essentials
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "dist/server.js"]