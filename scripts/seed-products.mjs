/**
 * One-time script to seed the Firestore products collection.
 * Run once after deploying Firestore rules.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/seed-products.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, collection, doc, setDoc } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

let credential
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
} else {
  const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'))
  credential = cert(serviceAccount)
}

initializeApp({ credential })
const db = getFirestore()

const products = [
  { id: 1,  cat: 'Tops',        bg: '#FFD9EC', ink: '#FF3D8B', enName: 'Cropped Band Tee',       hebrewName: 'חולצת להקה קרופ',       enPrice: 18,  hebrewPrice: 65,  tag: 'new in' },
  { id: 2,  cat: 'Dresses',     bg: '#E6DBFF', ink: '#7B5BFF', enName: 'Gingham Babydoll Dress',  hebrewName: 'שמלת בייבידול משבצות',  enPrice: 34,  hebrewPrice: 120, tag: '1 of 1' },
  { id: 3,  cat: 'Bottoms',     bg: '#CFE3FF', ink: '#2D7DD2', enName: 'Low-Rise Flare Jeans',    hebrewName: "ג׳ינס מתרחב נמוך מותן", enPrice: 28,  hebrewPrice: 99,  tag: 'restocked' },
  { id: 4,  cat: 'Outerwear',   bg: '#FFE9B0', ink: '#E59400', enName: 'Puffer Crop Jacket',      hebrewName: "ג׳קט פאפר קרופ",        enPrice: 46,  hebrewPrice: 160, tag: 'fan fave' },
  { id: 5,  cat: 'Accessories', bg: '#D9F5EC', ink: '#16C79A', enName: 'Beaded Shoulder Bag',     hebrewName: 'תיק כתף חרוזים',        enPrice: 22,  hebrewPrice: 75,  tag: 'new in' },
  { id: 6,  cat: 'Knit',        bg: '#FFD8C2', ink: '#FF6B3D', enName: 'Chunky Knit Cardigan',    hebrewName: 'קרדיגן סריג עבה',       enPrice: 30,  hebrewPrice: 105, tag: 'cozy' },
  { id: 7,  cat: 'Shoes',       bg: '#CFE3FF', ink: '#2D7DD2', enName: 'Platform Sneakers',       hebrewName: 'סניקרס פלטפורמה',       enPrice: 40,  hebrewPrice: 140, tag: 'almost gone' },
  { id: 8,  cat: 'Tops',        bg: '#FFD9EC', ink: '#FF3D8B', enName: 'Butterfly Halter Top',    hebrewName: 'טופ הולטר פרפר',        enPrice: 16,  hebrewPrice: 55,  tag: 'new in' },
  { id: 9,  cat: 'Dresses',     bg: '#E6DBFF', ink: '#7B5BFF', enName: 'Patchwork Denim Skirt',   hebrewName: "חצאית ג׳ינס טלאים",     enPrice: 36,  hebrewPrice: 125, tag: '1 of 1' },
  { id: 10, cat: 'Accessories', bg: '#FFE9B0', ink: '#E59400', enName: 'Fuzzy Bucket Hat',        hebrewName: 'כובע באקט פרוותי',      enPrice: 14,  hebrewPrice: 49,  tag: 'cute' },
  { id: 11, cat: 'Tops',        bg: '#D9F5EC', ink: '#16C79A', enName: 'Mesh Layer Long-Sleeve',  hebrewName: 'חולצת רשת ארוכה',       enPrice: 20,  hebrewPrice: 69,  tag: 'new in' },
  { id: 12, cat: 'Bottoms',     bg: '#FFD8C2', ink: '#FF6B3D', enName: 'Cargo Parachute Pants',   hebrewName: 'מכנסי פראשוט דגמ״ח',    enPrice: 32,  hebrewPrice: 110, tag: 'fan fave' },
]

async function seed() {
  const productsRef = collection(db, 'products')
  for (const p of products) {
    await setDoc(doc(productsRef, String(p.id)), {
      id: p.id,
      category: p.cat,
      backgroundHex: p.bg,
      inkHex: p.ink,
      en: {
        name: p.enName,
        price: p.enPrice,
        tag: p.tag,
      },
      he: {
        name: p.hebrewName,
        price: p.hebrewPrice,
        tag: p.tag,
      },
      photoUrl: null,
      createdAt: new Date(),
    })
  }
  console.log(`✓ Seeded ${products.length} products`)
}

seed().catch(console.error)
