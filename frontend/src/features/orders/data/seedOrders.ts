// ─── Demo orders ─────────────────────────────────────────────────────────────
// Pre-seeded mock orders across multiple users and statuses.
// User IDs match the mock users in usersService:
//   1 = Lina Haddad (admin), 2 = Omar, 3 = Sara, 4 = Yousef, 5 = Maya

import type { Order } from '../types/order.types'

export const SEED_ORDERS: Order[] = [
  {
    id: 'ORD-0001',
    userId: 2,
    items: [
      { productId: 1, name: "Writer's Desk Stationery Set", price: 34.99, qty: 2 },
      { productId: 3, name: 'Eclipse Marble Earbuds', price: 89.0, qty: 1 },
    ],
    total: 158.98,
    userName: 'Omar Khalil',
    status: 'delivered',
    createdAt: '2025-03-10T09:15:00Z',
    updatedAt: '2025-03-14T18:00:00Z',
  },
  {
    id: 'ORD-0002',
    userId: 3,
    items: [
      { productId: 7, name: 'Arc Smartwatch', price: 199.0, qty: 1 },
    ],
    total: 204.99,
    userName: 'Sara Nasser',
    status: 'shipped',
    createdAt: '2025-04-02T14:30:00Z',
    updatedAt: '2025-04-05T10:00:00Z',
  },
  {
    id: 'ORD-0003',
    userId: 4,
    items: [
      { productId: 6, name: 'Nomad Portable Speaker', price: 129.0, qty: 1 },
      { productId: 9, name: 'Artisan Ceramic Mug Set', price: 42.0, qty: 2 },
    ],
    total: 213.0,
    userName: 'Yousef Aziz',
    status: 'confirmed',
    createdAt: '2025-04-18T11:00:00Z',
    updatedAt: '2025-04-18T11:00:00Z',
  },
  {
    id: 'ORD-0004',
    userId: 5,
    items: [
      { productId: 4, name: 'Aurora Pink Earbuds', price: 79.0, qty: 1 },
    ],
    total: 84.99,
    userName: 'Maya Saleh',
    status: 'pending',
    createdAt: '2025-05-01T08:45:00Z',
    updatedAt: '2025-05-01T08:45:00Z',
  },
  {
    id: 'ORD-0005',
    userId: 2,
    items: [
      { productId: 10, name: 'ProView Gaming Monitor Set', price: 649.0, qty: 1 },
    ],
    total: 649.0,
    userName: 'Omar Khalil',
    status: 'cancelled',
    createdAt: '2025-05-10T16:20:00Z',
    updatedAt: '2025-05-11T09:00:00Z',
  },
  {
    id: 'ORD-0006',
    userId: 3,
    items: [
      { productId: 2, name: 'Noir Over-Ear Headphones', price: 149.0, qty: 1 },
      { productId: 1, name: "Writer's Desk Stationery Set", price: 34.99, qty: 1 },
    ],
    total: 183.99,
    userName: 'Sara Nasser',
    status: 'delivered',
    createdAt: '2025-05-20T12:00:00Z',
    updatedAt: '2025-05-25T14:00:00Z',
  },
  {
    id: 'ORD-0007',
    userId: 4,
    items: [
      { productId: 8, name: 'Horizon Film Camera', price: 189.0, qty: 1 },
    ],
    total: 194.99,
    userName: 'Yousef Aziz',
    status: 'shipped',
    createdAt: '2025-06-01T09:30:00Z',
    updatedAt: '2025-06-03T11:00:00Z',
  },
  {
    id: 'ORD-0008',
    userId: 5,
    items: [
      { productId: 5, name: 'Obsidian Noir Earbuds', price: 99.0, qty: 1 },
      { productId: 9, name: 'Artisan Ceramic Mug Set', price: 42.0, qty: 1 },
    ],
    total: 141.0,
    userName: 'Maya Saleh',
    status: 'confirmed',
    createdAt: '2025-06-10T14:00:00Z',
    updatedAt: '2025-06-10T14:00:00Z',
  },
]
