/**
 * One-time script to grant admin role to a Firebase user via Custom Claims.
 *
 * Prerequisites:
 *   npm install -D firebase-admin
 *
 * Usage:
 *   ADMIN_UID=<uid> GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/set-admin-claim.mjs
 *
 * Get a service account JSON from:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 *
 * The target user must sign out and back in for the new claim to take effect
 * (Firebase ID tokens cache for up to 1 hour).
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const uid = process.env.ADMIN_UID
if (!uid) {
  console.error('Error: ADMIN_UID env var is required.\nExample: ADMIN_UID=abc123 node scripts/set-admin-claim.mjs')
  process.exit(1)
}

let credential
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
} else {
  const __dir = dirname(fileURLToPath(import.meta.url))
  const serviceAccountPath = join(__dir, '..', 'service-account.json')
  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
    credential = cert(serviceAccount)
  } catch {
    console.error('Error: No credentials found.\nSet GOOGLE_APPLICATION_CREDENTIALS or place service-account.json in the project root.')
    process.exit(1)
  }
}

initializeApp({ credential })

const userRecord = await getAuth().getUser(uid)
const currentRoles = (userRecord.customClaims?.roles ?? [])

if (currentRoles.includes('admin')) {
  console.log(`User ${uid} (${userRecord.email ?? 'no email'}) already has the admin role.`)
} else {
  await getAuth().setCustomUserClaims(uid, { roles: [...currentRoles, 'admin'] })
  console.log(`✓ Granted admin role to ${userRecord.email ?? uid}`)
  console.log('  The user must sign out and back in for the change to take effect.')
}
