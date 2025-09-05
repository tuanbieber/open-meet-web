# Use an official Node.js image as the base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json if present
COPY package*.json ./

# Install dependencies (will fail if package.json is missing)
RUN npm install || true

# Copy the rest of the app
COPY . .

# Expose port 8080
EXPOSE 8080

# Simple static server for HTML/JS (using http-server)
RUN npm install -g http-server

# Start the static server
CMD ["http-server", ".", "-p", "8080"]
