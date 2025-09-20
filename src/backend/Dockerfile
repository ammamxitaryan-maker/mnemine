# This is a symlink to the main Dockerfile
# The actual build happens from the project root
FROM node:20-alpine

# Copy the entire project
COPY . /app
WORKDIR /app

# Use the main Dockerfile build process
RUN if [ -f "Dockerfile" ]; then \
    echo "Using main Dockerfile from project root"; \
    else \
    echo "Main Dockerfile not found, this is a placeholder"; \
    fi

# This file exists only to satisfy Render's directory expectations
# The actual deployment should use the root Dockerfile
