# ADR 0001 — Google Sign-in as the sole auth provider (for now)

**Status:** Accepted

## Decision
Shoppers authenticate exclusively via Google Sign-in. Email/password is not offered. Apple Sign-in is deferred.

## Reasons
- One-tap sign-in; no password reset or email verification flow to build.
- Target audience is mobile-first; Google is ubiquitous on Android and common on iOS.
- Email/password adds meaningful complexity (verification emails, forgot-password, weak-password UX) for no current benefit.

## Trade-offs
- Users without a Google account cannot sign in. Accepted for now; Apple Sign-in covers the remaining iOS-heavy segment when added.
- Apple Sign-in will be required by App Store rules if a native iOS app is ever published.
