# 📋 PROJECT CONTEXT - CoiCine

> **QUAN TRỌNG**: File này giúp AI nhớ context dự án giữa các sessions.
> Hãy update thường xuyên để AI hiểu được tiến độ và những gì đã làm.

---

## 📊 Project Status

| Field | Value |
|-------|-------|
| **Phase** | **Phase 8: Optimization & Production Readiness (100% COMPLETED)** — Đạt **VICTORY CONFIRMED** |
| **Started** | 2026-04-01 |
| **Last Updated** | **2026-10-25** |
| **Current Task** | 🏆 Hoàn tất 100% Phase 7 (Admin Dashboard) và Phase 8 (Two-tier Redis Cache & Invalidation, Dynamic SEO Metadata, Offline Font Fallback Resilience, Multi-stage Dockerization cho API & Web Standalone, và GitHub Actions CI/CD Pipeline). Toàn bộ 9/9 test suites với 79/79 unit tests pass 100% offline, 0 lỗi TypeScript, 0 lỗi Linter, Monorepo build thành công 100%. |

### Phases Progress:
- [x] **Phase 1: System Design & Architecture** (100% - COMPLETED)
- [x] **Phase 2: Backend Core & Foundation** (100% - COMPLETED)
- [x] **Phase 3: Frontend Core UI & Branding** (100% - COMPLETED)
- [x] **Phase 4: Real-time Seat Booking System** (100% - COMPLETED)
- [x] **Phase 5: Order & Payment Integration** (100% - COMPLETED)
- [x] **Phase 6: AI Assistant & Recommendation** (100% - COMPLETED)
- [x] **Phase 7: Admin Dashboard** (100% - COMPLETED)
- [x] **Phase 8: Optimization & Deployment** (100% - COMPLETED)

---

## 🛠️ Tech Stack & Source of Truth

- **Source of Truth:** Toàn bộ logic nghiệp vụ và kỹ thuật nằm trong thư mục `/docs`.
- **Frameworks:** Next.js 15 (Frontend) & NestJS (Backend).
- **Architecture:** Monorepo (Turborepo) - Giúp chia sẻ Type/Schema giữa FE và BE.
- **Backend Port**: `3006` | **Frontend Port**: `3000`
- **DB**: Supabase PostgreSQL.
- **Cache & Real-time**: Upstash Redis (Two-Phase Locking) + Socket.io.
- **AI Model**: Gemini 2.5 Flash (`@ai-sdk/google`).

---

## 🌟 User Vision & Ideals

> **Cốt lõi:** Hệ thống chuyên nghiệp như CGV, Lotte, Ticketmaster. KHÔNG phải đồ án sinh viên.

1. **Strict Seat Locking:** Two-Phase Locking (Soft-lock WebSocket + Hard-lock Redis Lua) với JWT authentication nghiêm ngặt (`WsJwtGuard`).
2. **Continuous Timer:** 5 phút từ lúc chọn ghế đầu, đối chiếu server-side và duy trì xuyên suốt sang Checkout.
3. **Premium Dark Mode UI.**
4. **No Race Conditions & Zero-Security Vulnerabilities.**

---

## ✅ Đã Giải Quyết Toàn Bộ 17 Lỗi Trong Master Plan (2026-09-15)

> Chi tiết kế hoạch tại [PLAN_MASTER_FIXES.md](file:///d:/Projects/cinema/.agent/PLAN_MASTER_FIXES.md)

1. [x] **WebSocket Gateway JWT Auth**: Đã tạo `WsJwtGuard`, trích xuất `userId` từ token handshake, cấm tuyệt đối giả mạo payload.
2. [x] **Xóa User Fallback**: Xóa bỏ `findFirst()` fallback trong `createBooking` (ném 401). Tách riêng `guest@coicine.com` trong AI Chatbot để không làm bẩn lịch sử của Admin.
3. [x] **Payment DB Update (`PAID`)**: Thêm `confirmMockPayment` và endpoint `POST /payment/:id/confirm` cập nhật `BookingStatus = PAID`, giữ nguyên vẹn `Seat.type` (NORMAL/VIP) của phòng chiếu.
4. [x] **Trang Đăng Ký `/auth/register`**: Tạo trang đăng ký giao diện Premium Dark Mode, tự động đăng nhập và cấp token ngay sau khi tạo tài khoản.
5. [x] **Xóa `dummy-token`**: Checkout đã lấy token JWT thật từ `useAuth()`.
6. [x] **SeatGrid `currentUserId`**: Lấy `userId` trực tiếp từ Auth Context và truyền vào `SeatGrid`, ghế đã chọn đổi màu xanh mượt mà.
7. [x] **Vá Lỗ Hổng IDOR Payment**: Kiểm tra `booking.userId === req.user.id` trước khi tạo Payment Intent hay xuất mã QR.
8. [x] **Tính Giá Vé VIP/Sweetbox**: Áp dụng hệ số VIP (1.5x) và Sweetbox (2.0x) đồng bộ trên cả Backend và Frontend, định dạng tiền chuẩn VNĐ.
9. [x] **Dữ Liệu Suất Chiếu Tương Lai**: Nạp thành công **93 suất chiếu** phủ kín 7 ngày cho 13 bộ phim bom tấn.
10. [x] **CORS Whitelist**: Chuyển từ `origin: true` sang whitelist nghiêm ngặt các domain frontend cho cả HTTP và WebSocket.
11. [x] **Rate Limiting Auth**: Thêm `@Throttle` giới hạn 5 request/phút cho login và register.
12. [x] **Tên Thương Hiệu "CoiCine"**: Đồng nhất `CINEMA_APP_NAME = "CoiCine"` trong toàn bộ monorepo.
13. [x] **Tối Ưu AI Context & Amnesia**: Rút gọn history 10 messages, chống lặp prompt, ép nhắc tên phim trong content.
14. [x] **Phân Trang Phim**: Bổ sung `page` và `limit` cho `MoviesService.findAll` và Controller.
15. [x] **Redis Safe Degradation**: Bọc `redisAvailable` và `try...catch` quanh tất cả hàm thao tác Redis, không bao giờ sập ứng dụng nếu Redis gián đoạn.
16. [x] **SocketProvider Auth**: Kết nối socket kèm handshake token, tự động reconnect khi đăng nhập/đăng xuất.
17. [x] **Build Check & Verification**: Backend và Frontend đều đạt **0 TypeScript errors**.

---

## 🔬 Kết Quả Zero-Defect Deep QA Audit (2026-09-15 ~ 2026-09-16)

> Đã bổ sung bộ kiểm thử Integration Test Suite trực tiếp trên Supabase DB, đạt **9/9 TESTS PASSED (100%)**:

1. [x] **Chống Double-Booking cấp Database**: Kiểm tra `bookingSeat.findFirst` trong DB trước khi tạo đơn vé, chặn đứng race conditions.
2. [x] **Bảo Toàn Thuộc Tính Vật Lý Của Ghế**: Loại bỏ lệnh ghi đè `seat.type = 'BOOKED'`. Ghế giữ nguyên thuộc tính vật lý `NORMAL` / `VIP`.
3. [x] **Tự Động Huỷ Chặn Ghế Quá Hạn (10 phút)**: Các đơn `PENDING` bị bỏ dở quá 10 phút sẽ tự động hết hiệu lực, nhả ghế cho người khác.
4. [x] **Lưu Đúng Giá Từng Ghế**: Cột `BookingSeat.price` lưu chính xác giá đã nhân hệ số theo loại ghế (VIP: 1.5x, Sweetbox: 2.0x).
5. [x] **Tự Động Confirm Cho Tất Cả Hình Thức Thanh Toán**: Card, QR Code và Saved Card đều gọi `confirmPayment` để chuyển DB sang `PAID`.
6. [x] **API & Trang Vé Điện Tử `/checkout/success`**: Thêm `GET /showtimes/bookings/:id`, trang thành công hiển thị đúng thông tin vé thật và hỗ trợ in/tải vé (`window.print`).
7. [x] **Đồng Nhất Giao Diện Thương Hiệu**: Logo `COICINE` (COI vàng, CINE trắng) đồng nhất trên toàn bộ Header và Footer.

---

## 🎯 Current Focus: Phase 7 - Admin Dashboard

1. **Kiến trúc Route Admin:** `/admin` được bảo vệ bởi `RolesGuard` (Role = `ADMIN`).
2. **Quản lý Suất Chiếu (Showtimes Management):** Tạo/Sửa/Xóa suất chiếu theo phòng và phim trực quan.
3. **Quản lý Phim (Movies Management):** Đồng bộ phim từ Trakt/TMDB hoặc thêm phim thủ công, upload poster, chỉnh sửa trạng thái.
4. **Quản lý Phòng Chiếu & Sơ đồ Ghế (Theaters & Seats):** Cấu hình phòng, sơ đồ ghế VIP/Normal.
5. **Thống Kê & Báo Cáo Doanh Thu (Analytics & Revenue):** Biểu đồ doanh thu theo ngày, tỷ lệ lấp đầy rạp.

---

## ✅ Completed Milestones

- [x] Roadmaps, Design Docs, API Specs hoàn chỉnh.
- [x] Monorepo (Turborepo) initialized.
- [x] Backend Core (Auth, Movie Module, DB Sync).
- [x] Frontend Cinematic UI (Next.js 15, Tailwind, React Query).
- [x] Home & Movie Detail connected with real Backend APIs.
- [x] System Audit & Optimization (2026-05-05).
- [x] Socket.io + Redis Two-Phase Seat Locking foundation.
- [x] Gemini 2.5 Flash AI integration với đầy đủ tools.
- [x] **Comprehensive Audit Phase 1-5 (2026-09-14)** — Bóc tách 15 lỗi hệ thống, xuất báo cáo `audit_phase1_5.md`.
- [x] **Master Fixes Plan (2026-09-15)** — Lập kế hoạch chi tiết từng bước cho toàn bộ 17 lỗi.
- [x] **Deep QA Audit & Zero-Defect Remediation (2026-09-15)** — Triển khai thành công toàn bộ 17 lỗi và vá bổ sung 7 lỗi ngầm, verified 0 errors.
- [x] **Phase 7: Admin Dashboard (2026-09-16)** — Xây dựng hoàn chỉnh phân hệ Quản trị: Backend RBAC API (`/api/admin/*`), KPI Analytics, Quản lý Phim + TMDB Sync, Lập lịch Suất chiếu có chống trùng giờ phòng, Sơ đồ Phòng & Ghế, Quản lý Đơn vé, Frontend Dark Mode, 5/5 Unit Tests Pass, 0 Build Errors.
- [x] **Deep Audit & E2E Verification Phase 7 (2026-09-16)** — Thực hiện kiểm thử chuyên sâu 14/14 Integration Tests Pass trên Supabase DB thật, hoàn thiện class-validator decorators cho strict ValidationPipe, xác nhận 29/29 tests pass trên toàn bộ 7 test suites backend.
- [x] **Cẩm Nang Chạy Dự Án & Test Thủ Công (2026-09-16)** — Xuất bản file `RUN_AND_TEST_GUIDE.md` hướng dẫn chi tiết cách tự chạy backend/frontend, tài khoản test, và quy trình kiểm thử thủ công từng tính năng từ người dùng đến quản trị.
- [x] **Phase 8: Optimization & Production Readiness (2026-10-25)** — Triển khai qua hệ thống Multi-Agent Teamwork Preview:
  1. *Two-tier Redis Caching & Invalidation*: Tích hợp Redis kết hợp in-memory Map TTL fallback tự phục hồi, cache endpoints phim và suất chiếu, tự động xóa cache theo pattern khi Admin thay đổi dữ liệu.
  2. *Offline Font Resilience & Next.js Standalone*: Loại bỏ phụ thuộc mạng bên ngoài cho Google Fonts, đảm bảo Next.js build hoàn toàn offline trong mọi môi trường; cấu hình `output: 'standalone'`.
  3. *Dynamic SEO Metadata*: Chuyển đổi `/movies/[id]` sang Server Component với `generateMetadata` chuẩn Next.js 15 cho OpenGraph và Twitter Cards.
  4. *Multi-stage Containerization & CI/CD Pipeline*: Dockerfile đa tầng tối ưu dung lượng cho cả `apps/api` và `apps/web` (Alpine, non-root user `dumb-init`), `docker-compose.yml` tích hợp Postgres, Redis, API, Web, và pipeline `.github/workflows/ci.yml`.
  5. *Zero-Defect Quality Gate*: 9/9 test suites passed (79/79 unit & hermetic tests), 0 lỗi TypeScript, 0 lỗi Linter, 3/3 Monorepo packages build thành công 100%, phê chuẩn độc lập **VICTORY CONFIRMED** bởi Victory Auditor.

---

## 📌 Next Steps: Production Deployment & Staging Launch

> **SẴN SÀNG CHO BÀN GIAO VÀ DEPLOY PRODUCTION**
>
> 1. **Khởi chạy môi trường Docker cục bộ**: Chạy `docker compose up --build` để xác thực toàn bộ hệ sinh thái chạy độc lập trên máy local.
> 2. **Kiểm thử Staging**: Triển khai trên môi trường Staging (Vercel cho Frontend, Render/Railway/Fly.io cho Backend).
> 3. **Cấu hình Domain & Production Secrets**: Khai báo các biến môi trường thực tế (Supabase DB, Upstash Redis, Stripe Live Keys).

---

## 💬 Notes

- Luôn kiểm tra `docs/06-api-spec.md` trước khi viết Endpoint.
- Luôn kiểm tra `docs/12-security-spec.md` cho middleware/auth.
- **UI/UX:** Tuân thủ `docs/09-ui-ux-spec.md` — Premium Dark Mode.
- **Database:** Tham chiếu `docs/05-data-erd.md`.
- **Shared Types:** Ưu tiên dùng `packages/shared` để tránh type mismatch FE/BE.

---

*Project Managed by Tuandaca | All Phase 1-8 Tests Passed: 2026-10-25*
