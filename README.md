# SwipeBite

SwipeBite is a Next.js + Firebase PWA for campus food discovery and feedback.

## Tech Stack

- Next.js 15 + React 19
- TypeScript (strict)
- Firebase Auth + Firestore
- Tailwind + Framer Motion

## Setup

1. Install dependencies.
2. Copy .env.example to .env.local and fill Firebase values.
3. Start dev server.

```bash
npm install
npm run dev
```

## Scripts

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run typecheck
- npm run test:rules

## Security Notes

- Super admin bootstrap is gated by env flags.
	- Set NEXT_PUBLIC_ENABLE_SUPERADMIN_SETUP=true only for first bootstrap.
	- Set NEXT_PUBLIC_OWNER_SETUP_TOKEN to a one-time setup token.
	- After first super admin creation, set NEXT_PUBLIC_ENABLE_SUPERADMIN_SETUP=false.
- Firestore rules are required for real RBAC. See docs/firestore-rules.md.

## Scale Notes

- Client queries now use bounded limits to avoid unbounded reads.
- For production scale, migrate dashboard/trending metrics to aggregated documents or cloud functions.

## Testing

Minimum release checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:rules
```
