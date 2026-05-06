# Use the official Node.js 18 image based on Alpine Linux
FROM node:18-alpine

# Create app directory inside the container
WORKDIR /usr/src/app

# Install dependencies
# Copying package.json first to leverage Docker cache layers
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of your application source code
COPY . .

# The application listens on port 3000
EXPOSE 3000

# Start the application using the entry point (Fixed trailing space)
CMD ["node", "src/index.js"]