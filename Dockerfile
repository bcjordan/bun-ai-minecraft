FROM oven/bun:1

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install

# Copy source
COPY . .

# Run
CMD ["bun", "run", "src/index.ts"]
