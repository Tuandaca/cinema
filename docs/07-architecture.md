# 07. System Architecture Documentation

## 1. High-Level Architecture (Cấu trúc tổng thể)
Hệ thống tuân thủ mô hình **Client-Server** với các thành phần:
- **Frontend (Next.js):** Render phía Server (SSR) cho các trang danh sách phim (SEO), Static Generation (SSG) cho các trang chi tiết, và Client-side (CSR) cho các tương tác real-time (Seat selection).
- **Backend (NestJS):** Cấu trúc Modular (Auth, Movie, Booking, AI). Đảm bảo tính mở rộng và dễ bảo trì.
- **Real-time Layer (Socket.io):** Đồng bộ trạng thái ghế qua WebSocket.
- **Data Layer:** PostgreSQL (Dữ liệu quan hệ) + Redis (Cache & Distributed Locking).

## 2. Frontend Architecture
- **Framework:** Next.js 15 (App Router).
- **State Management:** React Query (cho Server data) + Zustand (cho UI state/cart).
- **Animation:** Framer Motion (Transitions mượt mà, layout animation).
- **Styling:** TailwindCSS + shadcn/ui.

## 3. Backend Module Architecture
- **Controller Layer:** Tiếp nhận Request, validation body (Zod).
- **Service Layer:** Chứa Logic nghiệp vụ cốt lõi.
- **Repository Layer (Prisma):** Tương tác với DB.
- **Guard/Interceptor:** Xử lý Auth, Logging, và Transform response.

## 4. Cache & Real-time Flow
1. **Seat Selection:**
    - User chọn ghế -> Emit event `selectSeat` qua Socket.
    - Server nhận -> Gọi Redis Service để `SETNX` (Set if Not Exists).
    - Nếu thành công -> Broadcast `seatLocked` tới các client khác.
2. **API Caching:** Cache danh sách phim (`GET /movies`) trong Redis với TTL 1 giờ.

## 5. AI Service Integration
- **Flow:** User -> Backend -> OpenAI API -> Function Calling (Backend callbacks) -> Final Response.
- **Security:** API Key được lưu trong `.env` backend, không bao giờ lộ ra frontend.

## 6. Why chosen?
- **NestJS:** Cung cấp Dependency Injection mạnh mẽ, giống Angular, phù hợp cho team production.
- **Turborepo:** Quản lý Monorepo giúp chia sẻ Type giữa FE/BE, giảm thiểu lỗi runtime.
- **Railway/Vercel:** CI/CD tự động, tối ưu chi phí cho giai đoạn khởi đầu.
