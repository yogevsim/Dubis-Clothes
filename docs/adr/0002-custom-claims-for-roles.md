# ADR 0002 — Firebase Custom Claims for role storage

**Status:** Accepted

## Decision
User roles (e.g. `"admin"`) are stored as Firebase Custom Claims on the auth token (`token.roles: string[]`), not as a field on the Firestore user document.

## Reasons
- Claims live inside the JWT, so Firestore Security Rules can check `request.auth.token.roles.hasAny(['admin'])` without an extra document read.
- Roles cannot be written by the client — only by Firebase Admin SDK (server-side). This makes privilege escalation structurally impossible.
- The first Admin is bootstrapped via a one-time script that reads the target UID from an environment variable (`ADMIN_UID`) and sets `{ roles: ['admin'] }` as a custom claim.

## Trade-offs
- Claims are baked into the token; a role change takes effect on the user's next token refresh (up to 1 hour). Acceptable for a small store where role changes are rare.
- Setting claims requires Firebase Admin SDK — no browser-only path. A Cloud Function or a local bootstrap script is needed.
