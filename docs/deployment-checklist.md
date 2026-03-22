# Deployment Checklist

## 1. Preflight

- Verify environment variables are set in .env.local from .env.example.
- Ensure super admin bootstrap flag is locked down:
  - NEXT_PUBLIC_ENABLE_SUPERADMIN_SETUP=false
  - NEXT_PUBLIC_OWNER_SETUP_TOKEN is unset or rotated

## 2. Local Validation

Run all quality gates before release:

- npm run test
- npm run typecheck
- npm run lint
- npm run build

## 3. Firestore Security Deployment

- npm run firebase:login
- npm run firebase:use
- npm run firebase:deploy:rules
- npm run firebase:deploy:indexes

Or deploy both at once:

- npm run firebase:deploy:firestore

## 4. Post-Deploy Verification

- Student account can read items and create only own swipes.
- Kiosk owner can manage only own kiosk items.
- Super admin can manage kiosks and owner accounts.
- Unauthorized writes are denied in Firestore console simulator.

## 5. Operational Safety

- Rotate owner setup token if bootstrap was enabled.
- Keep NEXT_PUBLIC_ENABLE_SUPERADMIN_SETUP=false permanently after first setup.
- Monitor Firestore usage and add indexes for new query patterns.
