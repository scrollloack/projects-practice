# request-throttler-app

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.8. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

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
3. Key format: `rate:{ip}:{route}`
4. Reject when count exceeds limit

### Docker

* api (bun)
* redis
