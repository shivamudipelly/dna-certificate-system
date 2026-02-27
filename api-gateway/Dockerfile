# Use official lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install exact production dependencies securely
RUN npm ci --only=production

# Copy the rest of the source code
COPY . .

# Expose the API Gateway port
EXPOSE 5000

# Start gracefully prioritizing production module definitions
CMD ["npm", "start"]
