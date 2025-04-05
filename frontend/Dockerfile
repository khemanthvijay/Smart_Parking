# frontend/Dockerfile
FROM node:14-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (for caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application into the container
COPY . .

# Build the React app
RUN npm run build

# Install a simple static file server to serve the build
RUN npm install -g serve

# Expose the port that the React app will be running on
EXPOSE 3000

# Serve the React app
CMD ["serve", "-s", "build"]
