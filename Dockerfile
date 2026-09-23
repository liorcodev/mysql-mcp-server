FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

FROM oven/bun:1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

USER bun
CMD ["bun", "src/index.ts"]
