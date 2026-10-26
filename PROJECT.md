# Project: CoiCine Turborepo — Comprehensive Upgrade & Real Payment Integration

## Architecture
- **Monorepo Layout**: pnpm workspace managed by Turborepo 2.4.
- **Backend (`apps/api`)**: NestJS 10 REST API with Prisma ORM 5 connecting to Supabase PostgreSQL, Redis (ioredis) with high-performance in-memory fallback, JWT authentication with RBAC, Socket.io WebSocket gateway for real-time seat locking.
- **Frontend (`apps/web`)**: Next.js 15 App Router, React 19, TailwindCSS, TanStack Query, Axios, Socket.io client, Lucide icons, Dark Mode UI with glassmorphism and gold accents (`#0A0A0E`, `#121218`, `#14141D`, `#E5A93C`, `#F59E0B`).
- **Shared Packages (`packages/shared`)**: Shared constants, types, and domain enums (`@cinema/shared`).

## Code Layout & File Boundaries
To guarantee zero merge conflicts and strictly independent worker execution:

### Milestone 1: Backend Engine, Database Seeding & Payment Services (R1, R5, R6-BE)
Files exclusively owned:
- `apps/api/src/scripts/seed-future-showtimes.ts`
- `apps/api/src/scripts/seed-posters-db.ts` (standalone or via seed)
- `apps/api/prisma/seed.ts`
- `apps/api/src/payment/payment.service.ts`
- `apps/api/src/payment/payment.controller.ts`
- `apps/api/src/booking/booking.controller.ts`

### Milestone 2: Frontend Core UI & Real-Time Sync (R1 Fallback, R2, R3 Modals)
Files exclusively owned:
- `apps/web/src/components/common/CinematicPoster.tsx`
- `apps/web/src/components/ui/ConfirmModal.tsx`
- `apps/web/src/components/movies/SeatGrid.tsx`
- `apps/web/src/app/admin/movies/page.tsx`
- `apps/web/src/app/admin/showtimes/page.tsx`

### Milestone 3: Frontend User Pages, Dashboard & Payment UI (R3, R4, R6-FE)
Files exclusively owned:
- `apps/web/src/app/checkout/page.tsx`
- `apps/web/src/app/profile/tickets/page.tsx`
- `apps/web/src/components/movies/MovieDetailView.tsx`
- `apps/web/src/app/movies/[id]/booking/page.tsx`
- `docs/PAYMENT_CONFIG.md`
- `.env.example`

### Milestone 4: Monorepo Verification & Forensic Audit Gate
Scope:
- Full monorepo typecheck (`tsc --noEmit`)
- Monorepo build (`pnpm build`)
- Backend unit and integration test suites (`pnpm --filter api test`)
- Empirical verifications (Challengers) and Forensic Integrity Audit (Auditor)

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Movie Posters Verified & Seeded | 13/13 movies have verified TMDB URLs in Supabase DB and seed scripts; 0 null, 0 404 | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Showtime Expansion (4,464 slots) | Seed 2026-10-26 to 2027-06-30 across room-1, 2, 3 with 6 standard slots, 0 collisions, >=4,000 count | M1 | ORIGINAL_REQUEST §R5 |
| 3 | Bank-Grade VietQR Napas 247 Service | Standard VietQR QuickLink generation with COICINE-[bookingId] and exact VNĐ amount; banking transfer metadata | M1 | ORIGINAL_REQUEST §R6 |
| 4 | Stripe Live Architecture & Zero-Decimal VND | Stripe PaymentIntent in zero-decimal VND with mock fallback and webhook readiness | M1 | ORIGINAL_REQUEST §R6 |
| 5 | Booking Controller API Alias | Add `@Get("my-tickets")` alias in BookingController for client compatibility | M1 | ORIGINAL_REQUEST §R4 |
| 6 | Cinematic Poster Fallback Component | Common `CinematicPoster` component with dark gradient, gold accents, and film icon fallback on error/null | M2 | ORIGINAL_REQUEST §R1 |
| 7 | Real-Time Seat Lock Sync & Amber Glow UI | Synchronize initial load soft-locks in `SeatGrid.tsx`, glowing amber/gold border, match legend, disable click on othersSelecting | M2 | ORIGINAL_REQUEST §R2 |
| 8 | ConfirmModal Glassmorphism Dark Mode | Dark mode confirmation modal component replacing `window.confirm()` in admin pages | M2 | ORIGINAL_REQUEST §R3 |
| 9 | Eliminate Native Alerts to Toast | Replace all `alert()` in `checkout/page.tsx` with `useToast()` (`showError`, `showWarning`) | M3 | ORIGINAL_REQUEST §R3 |
| 10 | My Tickets & Spending Dashboard | `/profile/tickets`: 3 tabs (Upcoming, Watched, All), spending stats in VNĐ, booking code, links to QR ticket, `ProtectedRoute` | M3 | ORIGINAL_REQUEST §R4 |
| 11 | Checkout Currency VNĐ & VietQR Display | Strict VNĐ formatting (`.toLocaleString('vi-VN') + ' đ'`, no `$`), VietQR payment UI with copy buttons | M3 | ORIGINAL_REQUEST §R6 |
| 12 | Cinematic Poster Integration in Views | Integrate `CinematicPoster` in `MovieDetailView.tsx`, `booking/page.tsx`, and `checkout/page.tsx` | M3 | ORIGINAL_REQUEST §R1 |
| 13 | Payment Configuration Documentation | Detailed configuration guide for VietQR (Bank ID, Account No, Name) and Stripe in `docs/PAYMENT_CONFIG.md` & `.env.example` | M3 | ORIGINAL_REQUEST §R6 |
| 14 | Monorepo Quality Gate & Integrity Forensics | Full typecheck, monorepo build, backend tests, reviewer checks, challenger verifications, forensic audit | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Backend Engine & DB Expansion | Posters DB update, room-3 upsert, 4,464 showtimes chunked seed, VietQR service, Stripe Live architecture, my-tickets alias | none | DONE |
| 2 | M2: Frontend Core UI & Real-Time Sync | CinematicPoster.tsx, ConfirmModal.tsx, SeatGrid.tsx initial load sync & amber glow border, admin confirm replacement | none | DONE |
| 3 | M3: User Pages, Dashboard & Payment UI | Checkout alert removal & VNĐ formatting, /profile/tickets upgrade, VietQR checkout display, poster integration, config docs | M1, M2 | DONE |
| 4 | M4: Monorepo Quality Gate & Forensic Audit | Monorepo build, backend tests, reviewers, challengers, forensic auditor verification | M1, M2, M3 | DONE |

---

## Interface Contracts

### 1. VietQR Payment Contract
```typescript
interface VietQRPaymentData {
  qrCodeUrl: string;       // https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NO>-compact2.png?...
  bankBin: string;         // e.g. "970436" (Vietcombank)
  bankName: string;        // e.g. "Vietcombank"
  accountNumber: string;   // e.g. "1028472918"
  accountName: string;     // e.g. "CONG TY TNHH COICINE VIETNAM"
  amount: number;          // exact integer in VNĐ
  transferContent: string; // e.g. "COICINE-012E9F4C"
}
```

### 2. User Bookings Contract
`GET /api/showtimes/bookings/my` (and alias `GET /api/booking/my-tickets`)
- Headers: `Authorization: Bearer <jwt_token>`
- Returns:
```typescript
Array<{
  id: string;
  userId: string;
  showtimeId: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "REFUNDED";
  createdAt: string;
  showtime: {
    id: string;
    startTime: string;
    endTime: string;
    movie: { id: string; title: string; posterUrl: string | null; runtime: number };
    room: { id: string; name: string };
  };
  seats: Array<{ seat: { id: string; row: string; number: number; type: string } }>;
  orderItems: Array<{ combo: { id: string; name: string; price: number }; quantity: number }>;
}>
```

### 3. SeatGrid State Contract
- Initial Load: Seats with `seat.status === 'SELECTING' && seat.lockedBy !== currentUserId` are mapped to `isOthersSelecting = true`.
- Real-time Socket: `seat_selecting` / `seat_unselected` events update `othersSelecting` set.
- Visual:
  - Class: `bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse cursor-not-allowed`
  - `disabled={isBooked || isLocked || isOthersSelecting}`
- Legend: Vietnamese matching 100%: "Ghế trống", "Ghế bạn chọn", "Đang chọn / Giữ chỗ", "Đang giữ / Tạm khóa", "Đã đặt".
