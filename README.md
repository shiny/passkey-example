# Passkey Demo

A minimal implementation of Passkey (WebAuthn) authentication using Next.js 14.

Passkeys replace passwords with cryptographic key pairs. Authentication happens via device biometrics (Face ID, Touch ID, Windows Hello) or PIN, eliminating phishing risks and password management overhead.

## Prerequisites

- Bun 1.0+ or Node.js 18+
- Redis (production only)

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Open http://localhost:3000 in your browser.

For local Redis:
```bash
docker run -d -p 6379:6379 redis
```

## Usage

1. Enter a username
2. Click "Register Passkey" to register
3. Complete the biometric prompt
4. Click "Login" to authenticate

## Deployment (Vercel)

### Redis Setup

Choose a Redis provider:

| Provider | Free Tier |
|----------|-----------|
| Upstash | 10K commands/day |
| Redis Cloud | 30MB |
| Railway | $5 credit |

### Environment Variables

Add `REDIS_URL` in Vercel project settings:

```
REDIS_URL=redis://default:xxx@your-redis-host:6379
```

Redeploy after adding the variable.

## Project Structure

```
app/
  page.tsx                      # UI components
  api/webauthn/
    register/options/route.ts   # Registration challenge
    register/verify/route.ts    # Registration verification
    login/options/route.ts      # Authentication challenge
    login/verify/route.ts       # Authentication verification
lib/
  webauthn.ts                   # WebAuthn utilities, Redis storage
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `RP_ID` | Relying Party ID | Auto-detected |
| `RP_ORIGIN` | Relying Party Origin | Auto-detected |

## Authentication Flow

```
Browser                    Server                     Redis
   |                          |                          |
   |-- 1. GET options ------->|                          |
   |<-- 2. challenge ---------|                          |
   |                          |                          |
   |   [biometric prompt]     |                          |
   |                          |                          |
   |-- 3. credential -------->|                          |
   |                          |-- 4. store ------------->|
   |<-- 5. verified ----------|                          |
```

1. Client requests registration/login options
2. Server generates a random challenge
3. Browser creates credential via WebAuthn API
4. Server verifies and stores the public key
5. Client receives success response

## Dependencies

- next 14.x
- @simplewebauthn/browser
- @simplewebauthn/server
- ioredis

## Scripts

```bash
bun run dev        # Start dev server
bun run build      # Production build
bun run typecheck  # TypeScript validation
```

## References

- https://webauthn.guide
- https://passkeys.dev
- https://simplewebauthn.dev/docs

## License

MIT
