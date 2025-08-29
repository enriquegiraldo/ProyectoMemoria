# Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3006

# Run the app
CMD ["npm", "run", "start"]