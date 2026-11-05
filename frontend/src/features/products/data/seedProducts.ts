// ─── Demo product catalogue ──────────────────────────────────────────────────
// Used to make the storefront fully functional without a running Laravel
// backend. The productsService reads from this list by default and falls back
// to it when the API is unreachable.
//
// Product images are Pexels photos under the Pexels License, bundled locally
// as 800x800 AVIF assets at quality 72. Source photo IDs by product order:
// 1509485, 3921864, 32940456, 33298189, 33384206, 31748137, 31406903,
// 37585377, 6312178, 17112932.
//
// NOTE: these are presentation/demo images. When the backend supplies real
// product image URLs, those take precedence — see productsService.

import type { Product, ProductCategory } from '../types/product.types'
import stationeryImage from '@/shared/assets/products/stationery-notebooks.avif'
import earbudsMarble from '@/shared/assets/products/earbuds-marble.avif'
import earbudsPink from '@/shared/assets/products/earbuds-pink.avif'
import earbudsNoir from '@/shared/assets/products/earbuds-noir.avif'
import earbudsRed from '@/shared/assets/products/earbuds-red.avif'
import speakerPortable from '@/shared/assets/products/speaker-portable.avif'
import smartwatchWhite from '@/shared/assets/products/smartwatch-white.avif'
import cameraVintage from '@/shared/assets/products/camera-vintage.avif'
import mugsWhite from '@/shared/assets/products/mugs-white.avif'
import gamingMonitors from '@/shared/assets/products/gaming-monitors.avif'

export const SEED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Writer’s Desk Stationery Set',
    description:
      'A thoughtful everyday writing set with a lined notebook and smooth-flowing pen, ready for notes, lists, and ideas.',
    price: 28,
    compareAtPrice: 36,
    category: 'Stationery',
    image: stationeryImage,
    availability: 'In stock',
    rating: 4.8,
    reviewCount: 1240,
    stock: 32,
    featured: true,
    createdAt: '2024-11-02',
  },
  {
    id: 2,
    name: 'Pulse True Wireless Earbuds',
    description:
      'Compact true-wireless earbuds with adaptive transparency, spatial audio, and a pocketable charging case. Up to 28 hours of total playback.',
    price: 129,
    category: 'Audio',
    image: earbudsMarble,
    availability: 'In stock',
    rating: 4.6,
    reviewCount: 880,
    stock: 60,
    featured: true,
    createdAt: '2024-12-10',
  },
  {
    id: 3,
    name: 'Bloom Wireless Earbuds',
    description:
      'A playful pop of colour with serious sound. Lightweight earbuds tuned for warm bass, splash resistance, and intuitive touch controls.',
    price: 99,
    category: 'Audio',
    image: earbudsPink,
    availability: 'In stock',
    rating: 4.4,
    reviewCount: 210,
    stock: 45,
    featured: false,
    createdAt: '2025-01-15',
  },
  {
    id: 4,
    name: 'Noir Wireless Earbuds',
    description:
      'Premium dark-edition earbuds with hybrid noise cancellation and a matte finish charging case. Designed for focused, distraction-free listening.',
    price: 149,
    category: 'Audio',
    image: earbudsNoir,
    availability: 'Low stock',
    rating: 4.5,
    reviewCount: 340,
    stock: 8,
    featured: false,
    createdAt: '2025-02-20',
  },
  {
    id: 5,
    name: 'Ember Wireless Earbuds',
    description:
      'Bold crimson earbuds with punchy sound and a secure sport fit. Sweat-proof and ready for the gym, the trail, and everywhere in between.',
    price: 109,
    category: 'Audio',
    image: earbudsRed,
    availability: 'Out of stock',
    rating: 4.3,
    reviewCount: 150,
    stock: 0,
    featured: false,
    createdAt: '2025-03-05',
  },
  {
    id: 6,
    name: 'Sonic Portable Bluetooth Speaker',
    description:
      'Room-filling 360° sound in a pocketable, IPX7 waterproof body. 20-hour battery and pair-two for true stereo separation.',
    price: 79,
    category: 'Audio',
    image: speakerPortable,
    availability: 'In stock',
    rating: 4.7,
    reviewCount: 510,
    stock: 73,
    featured: false,
    createdAt: '2024-10-18',
  },
  {
    id: 7,
    name: 'Vantage Smartwatch',
    description:
      'A slim AMOLED smartwatch with built-in GPS, heart-rate and SpO2 sensors, and a 7-day battery. Tracks 90+ workouts and sleeps through a full week.',
    price: 199,
    compareAtPrice: 229,
    category: 'Wearables',
    image: smartwatchWhite,
    availability: 'In stock',
    rating: 4.6,
    reviewCount: 670,
    stock: 24,
    featured: true,
    createdAt: '2024-12-22',
  },
  {
    id: 8,
    name: 'Heritage Film Camera Set',
    description:
      'A curated set of vintage film cameras for collectors and creatives. Fully mechanical, beautifully patinated, and ready to shoot.',
    price: 329,
    category: 'Photography',
    image: cameraVintage,
    availability: 'Low stock',
    rating: 4.9,
    reviewCount: 96,
    stock: 8,
    featured: true,
    createdAt: '2025-01-30',
  },
  {
    id: 9,
    name: 'Keep Calm Ceramic Mug',
    description:
      'A heavyweight 350ml ceramic mug with a smooth matte glaze. Microwave and dishwasher safe, and a daily ritual you will actually look forward to.',
    price: 19,
    category: 'Home & Kitchen',
    image: mugsWhite,
    availability: 'In stock',
    rating: 4.5,
    reviewCount: 410,
    stock: 200,
    featured: false,
    createdAt: '2024-09-12',
  },
  {
    id: 10,
    name: 'ProStream Gaming Monitor Setup',
    description:
      'A complete dual-monitor gaming station with high-refresh panels, ambient lighting, and a tidy cable-managed desk. Built for streamers and creators.',
    price: 899,
    category: 'Computing',
    image: gamingMonitors,
    availability: 'In stock',
    rating: 4.7,
    reviewCount: 142,
    stock: 12,
    featured: true,
    createdAt: '2025-02-08',
  },
]

export const SEED_CATEGORIES: ProductCategory[] = [
  'Stationery',
  'Audio',
  'Wearables',
  'Photography',
  'Computing',
  'Home & Kitchen',
]
