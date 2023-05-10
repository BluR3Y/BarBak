# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port 3000 for the application
EXPOSE 3000

# Set the command to start the application
CMD [ "npm", "start" ]