/**
 * lib/unsplashImages.ts
 *
 * Single source of truth for all Unsplash photography used in the app.
 * All images are royalty-free via Unsplash license.
 *
 * URL format: https://images.unsplash.com/photo-{id}?w={size}&q=80&auto=format&fit=crop
 *
 * Spot-check any URL by opening it in a browser before shipping.
 * Add &crop=faces to portrait shots for better auto-cropping.
 */

export interface UnsplashImage {
  url: string;
  credit: string; // photographer name — for optional Settings attribution UI
  blurhash?: string; // encode with https://blurha.sh if you want pixel-accurate placeholders
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const img = (id: string, credit: string, size = 800): UnsplashImage => ({
  url: `https://images.unsplash.com/${id}?w=${size}&q=80&auto=format&fit=crop`,
  credit,
});

const avatar = (id: string, credit: string): UnsplashImage => ({
  url: `https://images.unsplash.com/${id}?w=200&q=80&auto=format&fit=crop&crop=faces`,
  credit,
});

// ─── Categories ───────────────────────────────────────────────────────────────

/** Warm, real nursing/newborn moments — domestic light, diverse moms */
export const nursingMoments: UnsplashImage[] = [
  img('photo-1555252333-9f8e92e65df9', 'Ana Tablas'),
  img('photo-1561043433-9265f8a64e12', 'Nyana Stoica'),
  img('photo-1590962917943-7e1d11d1cce4', 'Lucy Wolski'),
  img('photo-1607346256330-dee7af15f7c5', 'Dragos Gontariu'),
  img('photo-1586015555751-63bb77f4322a', 'Hui Sang'),
];

/** Community moments — groups of women, laughter, shared spaces */
export const groupOfMoms: UnsplashImage[] = [
  img('photo-1529156069898-49953e39b3ac', 'Vonecia Carswell'),
  img('photo-1522075469751-3a6694fb2f61', 'Alexis Brown'),
  img('photo-1573496359142-b8d87734a5a2', 'Christina @ wocintechchat'),
  img('photo-1517841905240-472988babdf9', 'Allie Smith'),
  img('photo-1582213782179-e0d53f98f2ca', 'Tyler Nix'),
];

/** Nursery interiors — soft Scandi, minimal, calming */
export const nurseryInteriors: UnsplashImage[] = [
  img('photo-1519340241574-2cec6aef0c01', 'William Fortunato'),
  img('photo-1616281677557-a45be37d0b08', 'Beazy'),
  img('photo-1618220048045-10a6dbdf83e0', 'Sidekix Media'),
  img('photo-1609234056430-08a9e4d9dc0f', 'Tatiana Syrikova'),
];

/** Sleeping babies — close-up soft light, no harsh flash */
export const babySleeping: UnsplashImage[] = [
  img('photo-1519689680058-324335c77eba', 'Filip Mroz'),
  img('photo-1515488042361-ee00e0ddd4e4', 'Michal Bar Haim'),
  img('photo-1530177066733-9f9a1c44d9c5', 'Kelly Sikkema'),
  img('photo-1476703993599-0035a44b0a5d', 'Minnie Zhou'),
];

/** Outdoor walks — parks, strollers, fresh air, golden hour */
export const outdoorWalks: UnsplashImage[] = [
  img('photo-1591115765373-5207764f72e7', 'Daniel Thomas'),
  img('photo-1543269664-56d93c18bad3', 'Vitolda Klein'),
  img('photo-1563453392212-326f5e854473', 'Bence Halmosi'),
  img('photo-1566576912321-d58ddd7a6088', 'Erda Estremera'),
];

/** Postpartum wellness — yoga, meditation, journaling, self-care */
export const postpartumWellness: UnsplashImage[] = [
  img('photo-1506126613408-eca07ce68773', 'madison lavern'),
  img('photo-1544367567-0f2fcb009e0b', 'Conscious Design'),
  img('photo-1510894347713-fc3dc6166412', 'kike vega'),
  img('photo-1507120878965-54b2d3939100', 'Bruce Mars'),
];

/**
 * Avatar portraits — diverse women, face-cropped for 40–80px circles.
 * Used as stand-in avatars for posts and comments when authorPhotoUrl is null.
 */
export const avatarMothers: UnsplashImage[] = [
  avatar('photo-1531746020798-e6953c6e8e04', 'Ivana Cajina'),
  avatar('photo-1489424731084-a5d8b219a5bb', 'Autumn Goodman'),
  avatar('photo-1607748862156-7c548e7e98f4', 'Caique Silva'),
  avatar('photo-1548142813-c348350df52b', 'Omar Lopez'),
  avatar('photo-1573496359142-b8d87734a5a2', 'Christina @ wocintechchat'),
  avatar('photo-1508214751196-bcfd4ca60f91', 'Michael Dam'),
  avatar('photo-1517841905240-472988babdf9', 'Allie Smith'),
  avatar('photo-1529156069898-49953e39b3ac', 'Vonecia Carswell'),
];

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Deterministically picks an avatar based on a string (e.g. userId / name). */
export function deterministicAvatar(seed: string): UnsplashImage {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return avatarMothers[hash % avatarMothers.length]!;
}

/** Random pick — use only for demo/placeholder, not stable between renders. */
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
