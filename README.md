# Orquestra Gateway

> An API Gateway that acts as the conductor of a microservices orchestra — a single entry point that handles routing, security, rate limiting and governance for all downstream services.

## Architecture

```
Client (React Dashboard)
        │
        ▼
┌───────────────────────────────────────────┐
│           Orquestra Gateway :3000         │
│                                           │
│  ┌──────────┐  ┌───────────┐  ┌───────┐  │
│  │ JWT Auth │  │Rate Limit │  │Logger │  │
│  │middleware│  │Token Bucket│  │Winston│  │
│  └──────────┘  └───────────┘  └───────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │       Reverse Proxy (routing)       │  │
│  │  /v1/users  /v1/products /v1/orders │  │
│  │  /v2/users  /v2/products            │  │
│  └─────────────────────────────────────┘  │
└───────────┬───────────────────────────────┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
 :8081   :8082   :8083
 users  products orders
service  service service
```

## Features

| Feature | Implementation |
|---|---|
| **Reverse Proxy** | `http-proxy-middleware` with dynamic path rewriting |
| **JWT Authentication** | Centralized validation — downstream services get `x-user-*` headers |
| **Rate Limiting** | Token Bucket algorithm — Redis-backed with in-memory fallback |
| **API Versioning** | `/v1/` and `/v2/` routes — v2 adds HAL `_links` and pagination |
| **Error Standardization** | RFC 7807 Problem Details on every error response |
| **Observability** | Winston logging with correlation IDs + metrics endpoint |
| **Dashboard** | React + Tailwind — live metrics, service health, request log |
| **Automated Tests** | Postman collection with 30+ JS test scripts, Newman CLI runner |

## Stack

- **Gateway**: Node.js + TypeScript + Express
- **Services**: Node.js + TypeScript + Express (mock data)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Recharts
- **Rate Limit Store**: Redis (ioredis) with in-memory fallback
- **Testing**: Postman + Newman
- **Infra**: Docker + Docker Compose

## Quick Start

### Option 1 — Docker Compose (recommended)

```bash
docker compose up --build
```

Services will be available at:
- Gateway: http://localhost:3000
- Dashboard: http://localhost:5173
- Users: http://localhost:8081
- Products: http://localhost:8082
- Orders: http://localhost:8083

### Option 2 — Local development

```bash
# Install all workspace dependencies
npm install

# Copy gateway env
cp gateway/.env.example gateway/.env

# Start everything concurrently
npm run dev
```

## API Reference

### Authentication

```bash
# Login and get JWT
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@orquestra.dev", "password": "admin123"}'

# Use token in subsequent requests
export TOKEN="<accessToken from above>"
```

**Test credentials:**

| Email | Password | Role |
|---|---|---|
| admin@orquestra.dev | admin123 | admin |
| user@orquestra.dev | user123 | user |

### Proxy Routes

```bash
# Users — v1 (simple array)
GET /api/v1/users
GET /api/v1/users/:id
POST /api/v1/users
PUT /api/v1/users/:id
DELETE /api/v1/users/:id

# Products — v2 (HAL pagination)
GET /api/v2/products?page=1&limit=10

# Orders — with state machine
POST /api/v1/orders
PATCH /api/v1/orders/:id/status

# Gateway meta
GET /health
GET /api/v1/gateway/routes
GET /api/v1/gateway/metrics  (admin only)
GET /api/v1/gateway/services (authenticated)
```

### Rate Limiting

Every API response includes:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 600
X-RateLimit-Policy: 100;w=60
```

When exceeded, the gateway returns **HTTP 429** with RFC 7807 body:

```json
{
  "type": "https://orquestra-gateway.dev/errors/429",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Allowed 100 req/60s. Retry after 1s.",
  "instance": "/api/v1/users",
  "timestamp": "2024-06-29T10:00:00.000Z"
}
```

### Error Standardization (RFC 7807)

All errors follow the [Problem Details](https://www.rfc-editor.org/rfc/rfc7807) standard:

```json
{
  "type": "https://orquestra-gateway.dev/errors/401",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Missing or malformed Authorization header.",
  "instance": "/api/v1/users",
  "correlationId": "a3f2c1b4-...",
  "timestamp": "2024-06-29T10:00:00.000Z"
}
```

## Running API Tests

```bash
# Install Newman globally
npm install -g newman

# Run full test suite
bash postman/run-tests.sh

# Or via npm from root
npm run test:api
```

Newman will run 30+ test cases across 8 test folders and report pass/fail for:
- Status codes (200, 201, 401, 403, 404, 429)
- Response time thresholds
- RFC 7807 schema validation
- Rate limit header presence
- API v1 vs v2 response shape differences
- JWT flow (login → use token → verify claims)

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Gateway port |
| `JWT_SECRET` | `orquestra-dev-secret` | JWT signing secret |
| `JWT_EXPIRES_IN` | `1h` | Token expiry |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection (optional) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window in ms (60s) |
| `USERS_SERVICE_URL` | `http://localhost:8081` | Users service URL |
| `PRODUCTS_SERVICE_URL` | `http://localhost:8082` | Products service URL |
| `ORDERS_SERVICE_URL` | `http://localhost:8083` | Orders service URL |

## Project Structure

```
orquestra-gateway/
├── gateway/                    # API Gateway (Node.js + TypeScript)
│   └── src/
│       ├── index.ts            # Express app bootstrap
│       ├── config/             # Environment-based config
│       ├── middleware/
│       │   ├── auth.ts         # JWT validation + role enforcement
│       │   ├── rateLimiter.ts  # Token Bucket (Redis + fallback)
│       │   ├── errorHandler.ts # RFC 7807 Problem Details
│       │   └── logger.ts       # Winston + correlation IDs
│       ├── proxy/              # Reverse proxy setup
│       ├── routes/             # Auth + gateway meta routes
│       └── metrics/            # In-memory metrics aggregation
├── services/
│   ├── users/                  # Users microservice (:8081)
│   ├── products/               # Products microservice (:8082)
│   └── orders/                 # Orders microservice (:8083)
├── frontend/                   # React dashboard (Vite + Tailwind)
├── postman/
│   ├── collection.json         # 30+ Postman test requests
│   ├── environment.json        # Dev environment variables
│   └── run-tests.sh            # Newman CLI runner script
└── docker-compose.yml          # Full stack dev environment
```
