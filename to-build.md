# Build

- Make projects for each of the listed learnings below
- Make sure they are detailed with explanations step by step.
- Make sure the projects are built with docker.
- The tech stack I would use are nodejs/typescript, postgresql and if you recommend the use of redis and others make sure to note them.
- Suggest if using NestJS makes sense.
- At the end after making mini projects for each, make a final project that combines all learnings in the list.
- Make it BDD style.
- You can put everything to each of their own MD/markdown file in your canvas.

# TO-DO
1. [Build a Request Throttler to understand time windows and counters.](#01-request-throttlermd)
2. [Build a Login System with sessions to learn hashing and expiry.](#02-login-system-sessionsmd)
3. [Build a Reminder App to practice scheduling and retries.](#03-reminder-appmd)
4. [Build a File-Based Cache to work with TTL and invalidation.](#04-file-based-cachemd)
5. [Build a Mini REST API to understand routing and middleware.](#05-mini-rest-apimd)
6. [Build a Webhook Receiver to handle signatures and duplicate events.](#06-webhook-receivermd)
7. [Build a Feature Toggle App to manage runtime flags safely.](#07-feature-toggle-appmd)
8. [Build a Log Viwer to work with files, timestamps, and filtering.](#08-log-viewermd)
9. [Build an Input Validation Tool to handle schemas and bad data.](#09-input-validation-toolmd)
10. [Build a Backup Tool to practice data copy, restore and versioning.](#10-backup-toolmd)
11. [Production Backend Platform](#final-projectmd--production-backend-platform)

# Backend Systems Learning Projects (BDD + Docker)

This document is an **end-to-end backend systems curriculum**, focused on *how things really work in production*.

You will build **10 focused mini-projects** and **1 large capstone**, all:

* Dockerized
* BDD-driven (Given / When / Then)
* Using **Node.js + TypeScript**
* Using **PostgreSQL** consistently
* Using **Redis only when it teaches something real**

---

## App Bootstrapping Reference

### Express + Bun (skip git)

> Bun does not scaffold Express for you. You create the app manually.

```bash
bun init --no-git
bun add express
bun add -d typescript @types/express
```

Minimal server:

```ts
import express from 'express'

const app = express()
app.use(express.json())

app.get('/health', (_, res) => res.send('ok'))

app.listen(process.env.PORT || 3000)
```
---

## Docker Reference (Clean)

### Express + Bun — DEV

### Environment files

#### .env.dev

```
NODE_ENV=development
PORT=3000
```

#### .env.prod

```
NODE_ENV=production
PORT=3000
```

#### Dockerfile.dev

```Dockerfile
FROM oven/bun:1.1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
EXPOSE 3000
CMD ["bun", "--watch", "src/server.ts"]
```

#### docker-compose.dev.yml

```yaml
version: "3.9"
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    env_file: .env.dev
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json
      - ./bun.lockb:/app/bun.lockb
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      retries: 5
```

Run:

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

### Express + Bun — PROD

#### Dockerfile

```Dockerfile
FROM oven/bun:1.1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY src ./src
EXPOSE 3000
CMD ["bun", "run", "src/server.ts"]
```

#### docker-compose.prod.yml

```yaml
version: "3.9"
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    env_file: .env.prod
    ports:
      - "3000:3000"
```

Run:

```bash
docker compose -f docker-compose.prod.yml up --build
```

---

### NestJS (skip git)

```bash
npm i -g @nestjs/cli
nest new app-name --skip-git
```

NestJS is used when:

* You need guards, interceptors, or workers
* You want strict module boundaries

### NestJS — DEV

### Environment files

#### .env.dev

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://app:app@postgres:5432/app
REDIS_URL=redis://redis:6379
```

#### .env.prod

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://app:app@postgres:5432/app
REDIS_URL=redis://redis:6379
```

#### Dockerfile.dev

```Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
```

#### docker-compose.dev.yml

```yaml
version: "3.9"
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    env_file: .env.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5
```

Run:

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

### NestJS — PROD

#### Dockerfile

```Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### docker-compose.prod.yml

```yaml
version: "3.9"
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    env_file: .env.prod
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5
```

Run:

```bash
docker compose -f docker-compose.prod.yml up --build
```

---

## 01-request-throttler.md

### App type

Express + Bun

### Why not NestJS here?

You should *feel* the pain of middleware ordering and shared state.

### BDD Scenarios

**Scenario: Allow requests under limit**
Given a client IP
And a limit of 10 requests per minute
When 5 requests are sent
Then all succeed

**Scenario: Block requests over limit**
Given the same client IP
When the 11th request is sent
Then HTTP 429 is returned

### Step-by-step

1. Bootstrap Express app with Bun
2. Create rate-limit middleware
3. Use Redis `INCR` + `EXPIRE`
4. Key format: `rate:{ip}:{route}`
5. Reject when count exceeds limit

### Docker

* api (bun)
* redis

[Go to top](#to-do)

---

## 02-login-system-sessions.md

### App type

NestJS

### Why NestJS here?

Sessions, guards, and decorators are painful without structure.

### BDD Scenarios

**Scenario: Successful login**
Given a registered user
When valid credentials are submitted
Then a session is created

**Scenario: Session expiry**
Given an expired session
When accessing a protected route
Then access is denied

### Step-by-step

1. Create User entity
2. Hash password with bcrypt
3. Store sessions in Redis with TTL
4. Issue HTTP-only cookie
5. Guard protected routes

### Docker

* api (node)
* postgres
* redis

[Go to top](#to-do)

---

## 03-reminder-app.md

### App type

NestJS (API + Worker)

### Step-by-step

1. Create reminders table
2. Store schedule time
3. Worker polls Redis sorted set
4. Execute reminders
5. Retry failures with backoff

### Docker

* api
* worker
* postgres
* redis

---

## 04-file-based-cache.md

### App type

Express + Bun

### Step-by-step

1. Store cache entries as files
2. Include TTL metadata
3. Validate expiry on read
4. Periodic cleanup

### Docker

* api with volume mount

[Go to top](#to-do)

---

## 05-mini-rest-api.md

### App type

NestJS

### Step-by-step

1. Controller routes
2. Middleware for logging
3. Guards for auth
4. Service for business logic

[Go to top](#to-do)

---

## 06-webhook-receiver.md

### App type

NestJS

### Step-by-step

1. Verify HMAC signature
2. Store event IDs
3. Ignore duplicates
4. Acknowledge quickly

[Go to top](#to-do)

---

## 07-feature-toggle-app.md

### App type

NestJS

### Step-by-step

1. Store flags in DB
2. Cache in Redis
3. Add fallback defaults
4. Support percentage rollouts

[Go to top](#to-do)

---

## 08-log-viewer.md

### App type

Express + Bun

### Step-by-step

1. Stream log files
2. Parse timestamps
3. Filter and paginate

[Go to top](#to-do)

---

## 09-input-validation-tool.md

### App type

NestJS

### Step-by-step

1. Define schemas with Zod
2. Validate request DTOs
3. Normalize errors

[Go to top](#to-do)

---

## 10-backup-tool.md

### App type

Express + Bun

### Step-by-step

1. Dump Postgres data
2. Version snapshots
3. Restore by version

[Go to top](#to-do)

---

## FINAL-PROJECT.md — Production Backend Platform

### What you build

A **SaaS-grade backend platform** that mirrors real systems:

### Features combined

* Auth + sessions
* Rate limiting
* Feature flags
* Webhooks
* Background jobs
* Validation
* Logging
* Backups

### Architecture

```
apps/
  api/
  worker/
libs/
  auth/
  rate-limit/
  validation/
```

### Expanded BDD Scenario

**Scenario: Feature-gated action with background processing**
Given an authenticated user
And feature flag enabled
And request is under rate limit
When user triggers an action
Then a job is queued
And execution is logged
And retries occur on failure

### Why this matters

This is essentially:

* A payments backend
* A notifications service
* A SaaS API core

If you can build this cleanly, you are operating at **senior backend level**.

[Go to top](#to-do)