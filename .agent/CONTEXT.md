# 📋 PROJECT CONTEXT - CoiCine

> **QUAN TRỌNG**: File này giúp AI nhớ context dự án giữa các sessions.
> Hãy update thường xuyên để AI hiểu được tiến độ và những gì đã làm.

---

## 📊 Project Status

| Field | Value |
|-------|-------|
| **Phase** | Cuối Phase 6 → Bắt đầu **Phase 7: Admin Dashboard** |
| **Started** | 2026-04-01 |
| **Last Updated** | **2026-09-16** |
| **Current Task** | 🏆 Hoàn tất 100% Phase 1-6 sau Master Fixes & Zero-Defect Deep QA Audit (9/9 Tests Pass). Sẵn sàng bắt tay vào Phase 7 (Admin Dashboard). |

### Phases Progress:
- [x] **Phase 1: System Design & Architecture** (100% - COMPLETED)
- [x] **Phase 2: Backend Core & Foundation** (100% - COMPLETED)
- [x] **Phase 3: Frontend Core UI & Branding** (100% - COMPLETED)
- [x] **Phase 4: Real-time Seat Booking System** (100% - COMPLETED)
- [x] **Phase 5: Order & Payment Integration** (100% - COMPLETED)
- [x] **Phase 6: AI Assistant & Recommendation** (100% - COMPLETED)
- [ ] **Phase 7: Admin Dashboard** (0% - BẮT ĐẦU NGAY)
- [ ] **Phase 8: Optimization & Deployment** (0%)

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
- [x] **Zero-Defect Stress & Integration Verification (2026-09-16)** — Kiểm thử thực nghiệm DB 9/9 Pass, đồng bộ vé thật, push toàn bộ GitHub. Đóng Phase 1-6.

---

## 📌 Next Steps (Dành cho Agent ở phiên tiếp theo)

> **BẮT ĐẦU PHASE 7: ADMIN DASHBOARD**
>
> 1. Thiết lập Layout Admin tại `apps/web/src/app/admin/layout.tsx` với Sidebar quản trị Dark Mode chuyên nghiệp.
> 2. Xây dựng trang tổng quan `/admin`: Thống kê Doanh thu, Số vé đã bán, Số phim đang chiếu, Tỷ lệ lấp đầy.
> 3. Xây dựng module Quản lý Phim `/admin/movies`: Danh sách, Thêm mới, Sửa, Xóa, Nút "Sync from Trakt".
> 4. Xây dựng module Quản lý Suất Chiếu `/admin/showtimes`: Lịch chiếu theo phòng trực quan dạng Calendar hoặc Timeline.
> 5. Xây dựng module Quản lý Đơn Hàng `/admin/bookings`: Xem danh sách vé đã bán, trạng thái thanh toán.

---

## 💬 Notes

- Luôn kiểm tra `docs/06-api-spec.md` trước khi viết Endpoint.
- Luôn kiểm tra `docs/12-security-spec.md` cho middleware/auth.
- **UI/UX:** Tuân thủ `docs/09-ui-ux-spec.md` — Premium Dark Mode.
- **Database:** Tham chiếu `docs/05-data-erd.md`.
- **Shared Types:** Ưu tiên dùng `packages/shared` để tránh type mismatch FE/BE.

---

*Project Managed by Tuandaca | All Phase 1-6 Tests Passed: 2026-09-16*
