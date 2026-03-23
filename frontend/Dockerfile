# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the build output to the Nginx public directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf


# Expose port 80
EXPOSE 80

# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]
