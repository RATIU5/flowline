# ---- Base ----
# Use the official Bun image with an Alpine base for a smaller footprint.
FROM oven/bun:alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies ----
# Install dependencies in a separate layer to leverage Docker's caching.
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# ---- Build ----
# Build the application.
FROM base AS build
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
# If you have a build step, uncomment the following line
# RUN bun run build

# ---- Production ----
# Create the final, lean production image.
FROM base AS production
WORKDIR /usr/src/app

# Copy only the necessary production dependencies.
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy the built application code. If you have a build step,
# you will likely copy from the 'build' stage.
# For a simple server, you might just copy the source.
COPY --from=build /usr/src/app/src ./src

# Expose the port your application will run on.
EXPOSE 8080

# Define the command to run your application.
# Replace 'src/index.ts' with the entry point of your server.
CMD ["bun", "src/index.ts"]
