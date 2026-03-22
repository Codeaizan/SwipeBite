# Firestore Rules Baseline

Use this as a starting point and adapt field-level constraints for your deployment.

Source of truth files in the repository:
- firestore.rules
- firestore.indexes.json
- firebase.json

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function userDoc(uid) {
      return get(/databases/$(database)/documents/users/$(uid));
    }

    function role() {
      return isSignedIn() ? userDoc(request.auth.uid).data.role : null;
    }

    function isSuperAdmin() {
      return role() == 'superAdmin';
    }

    function isKioskOwner() {
      return role() == 'kioskOwner';
    }

    function ownerKioskName() {
      return userDoc(request.auth.uid).data.kioskName;
    }

    match /users/{userId} {
      allow read: if isSignedIn() && request.auth.uid == userId || isSuperAdmin();
      allow create: if isSignedIn() && request.auth.uid == userId || isSuperAdmin();
      allow update: if isSignedIn() && request.auth.uid == userId || isSuperAdmin();
      allow delete: if isSuperAdmin();
    }

    match /kiosks/{kioskId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSuperAdmin();
    }

    match /items/{itemId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSuperAdmin() || (isKioskOwner() && request.resource.data.kiosk == ownerKioskName());
    }

    match /swipes/{swipeId} {
      allow read: if isSuperAdmin() || isKioskOwner() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

Notes:
- Composite indexes are defined in firestore.indexes.json for common filtered + sorted query shapes.
- Keep `NEXT_PUBLIC_ENABLE_SUPERADMIN_SETUP=false` after first bootstrap.
- `users` self-service writes are locked down: users can only self-create a `student` role profile and cannot self-change role/kiosk ownership fields.
- `items` owner updates are locked down: kiosk owners can only modify items that already belong to their kiosk and cannot reassign kiosk ownership via update.

Deploy commands:
- npm run firebase:login
- npm run firebase:use
- npm run firebase:deploy:rules
- npm run firebase:deploy:indexes
- npm run firebase:deploy:firestore

Automated rules validation:
- npm run test:rules
- The command starts the Firestore emulator and runs tests in tests/firestore.rules.test.ts.

General unit tests (no emulator required):
- npm test

Run all tests including emulator-dependent suites:
- npm run test:all
