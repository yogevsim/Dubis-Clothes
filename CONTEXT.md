# Dubi's Clothes — Domain Glossary

## Visitor
A person browsing the store without an account. Can view the catalog and add items to a local cart. Cannot check out. Prompted to sign in via a modal when they attempt checkout — the modal is dismissible and does not navigate away from the page. No sign-in button is visible in the nav; sign-in only surfaces contextually.

## Nav State
- **Visitor**: logo, Shop button, cart bag button.
- **Shopper / Admin**: same as Visitor, plus a circular avatar (Google profile photo, or initials fallback) on the far end. Tapping the avatar navigates to `/profile`.

## Shopper
A Visitor who has signed in via Google Sign-in. Can check out and place Orders. Has a persisted cart. When a Visitor signs in, their local cart merges into the saved cart (quantities are summed). Apple Sign-in is a planned future provider. On sign-out, the local cart is retained in the UI; the Firestore cart remains saved under the account and merges again on next sign-in.

## User Profile
The Firestore document at `users/{uid}`. Stores data beyond what Google provides: `phone` (optional, added by the user) and `createdAt`. Display name, email, and photo come directly from the Firebase Auth token and are not duplicated here. No shipping address — physical delivery is out of scope for now. Edited on a dedicated `/profile` route, reachable from the nav avatar once signed in.

## Admin
A Shopper with the `admin` role. Manages products and views orders via a `/admin` route inside the same app. The route is protected — any user without the `admin` claim is redirected to home. The Admin nav link is only visible when `token.roles` includes `"admin"`. The first Admin is bootstrapped via an environment variable (their Firebase UID) using a one-time Admin SDK script. The role system is designed to support additional roles in the future.

## Role
A string granting elevated permissions (e.g. `"admin"`). Stored as a Firebase Custom Claim on the user's auth token (`token.roles: string[]`). Enforced in Firestore Security Rules via `request.auth.token.roles`. Set server-side only — never writable by the client. The set of roles is open for extension.
