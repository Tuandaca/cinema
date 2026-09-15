# 🛠️ KẾ HOẠCH TỔNG THỂ KHẮC PHỤC LỖI (PHASE 1 → 6) - COICINE

> **Ngày lập:** 2026-09-15  
> **Người lập:** cinemaAgent  
> **Tài liệu tham chiếu:** `docs/`, `audit_phase1_5.md`, `ERRORS.md`, `PLAN_PHASE6_FIXES.md`

Tài liệu này tổng hợp toàn bộ 17 lỗi từ đợt kiểm tra chuyên sâu Phase 1-5 và quá trình kiểm thử thực tế Phase 6. Dự kiến thực hiện vào phiên làm việc tiếp theo.

---

## 📋 DANH SÁCH 17 LỖI THEO ĐỘ ƯU TIÊN

| STT | Mức độ | Lỗi / Vấn đề | File liên quan | Giải pháp vắn tắt |
|:---:|:---:|:---|:---|:---|
| 1 | 🔴 Critical | WebSocket Gateway không có JWT Auth | `apps/api/src/booking/booking.gateway.ts` | Tạo `WsJwtGuard`, trích xuất token từ handshake auth |
| 2 | 🔴 Critical | Fallback userId nguy hiểm trong Booking & AI | `apps/api/src/booking/booking.service.ts` | Xóa `findFirst()` fallback, throw 401 nếu thiếu user |
| 3 | 🔴 Critical | Webhook/Payment không update DB `PAID` | `apps/api/src/payment/payment.service.ts` | Update `booking.status = 'PAID'` khi thanh toán thành công |
| 4 | 🟠 High | Token hardcode `dummy-token` ở Checkout | `apps/web/src/app/checkout/page.tsx:162` | Sử dụng token từ `useAuth()` |
| 5 | 🟠 High | `SeatGrid.tsx` dùng random `userId` | `apps/web/src/components/movies/SeatGrid.tsx` | Nhận `user.id` từ context, xóa random ID |
| 6 | 🟠 High | IDOR lỗ hổng tại Payment Endpoints | `apps/api/src/payment/payment.controller.ts` | Kiểm tra quyền sở hữu `booking.userId === req.user.id` |
| 7 | 🟠 High | Tính giá vé bỏ qua ghế VIP/Sweetbox | `apps/api/src/booking/booking.service.ts` | Nhân hệ số theo `seat.type` (VIP 1.5x, Sweetbox 2x) |
| 8 | 🟡 Medium | CORS mở `origin: true` & `origin: '*'` | `apps/api/src/main.ts`, `booking.gateway.ts` | Giới hạn strictly theo whitelist `allowedOrigins` |
| 9 | 🟡 Medium | Timer 5 phút chỉ lưu trên localStorage | `apps/web/src/app/checkout/page.tsx` | Bổ sung kiểm tra hạn lock từ Redis |
| 10 | 🟡 Medium | `MoviesService.findAll` thiếu phân trang | `apps/api/src/movies/movies.service.ts` | Bổ sung `page` và `limit` |
| 11 | 🟡 Medium | Thiếu Rate Limit riêng cho Auth routes | `apps/api/src/auth/auth.controller.ts` | Bổ sung `@Throttle` cho `/auth/login`, `/auth/register` |
| 12 | 🔴 Blocker | Trang Đăng ký `/auth/register` bị 404 | `apps/web/src/app/auth/register/page.tsx` | Tạo trang register hoàn chỉnh Dark Mode |
| 13 | 🟢 Low | Thiếu cơ chế Refresh Token | `apps/api/src/auth/auth.service.ts` | Thiết kế thêm Refresh Token song song Access Token |
| 14 | 🟢 Low | Redis Degradation Fallback chưa an toàn | `apps/api/src/booking/booking.service.ts` | Bọc `redis.eval` kiểm tra `redisAvailable` |
| 15 | 🟢 Low | Tên Logo hiển thị "Cinema AIBooking" | `packages/shared/index.ts` | Đổi thành `CINEMA_APP_NAME = "CoiCine"` |
| 16 | 🔴 Blocker | DB thiếu suất chiếu tương lai | `apps/api/src/scripts/seed-data.ts` | Seed suất chiếu 7 ngày tiếp theo |
| 17 | 🔴 Blocker | Thiếu phim hot & AI context lặp lại | `apps/api/src/ai/ai.service.ts` | Seed phim hot, giảm history `take: 10`, ép prompt mới |

---

## 🚀 LỘ TRÌNH THỰC HIỆN TỪNG BƯỚC (STEP-BY-STEP ROADMAP)

### BƯỚC 1: XỬ LÝ TOÀN BỘ LỖI BẢO MẬT & XÁC THỰC (Security Hardening)
1. **Tạo Guard WebSocket:** `apps/api/src/auth/guards/ws-jwt.guard.ts`
   - Xác thực token từ handshake: `socket.handshake.auth.token`.
   - Gán payload `sub` vào `client.data.user`.
2. **Bảo vệ Gateway:** `apps/api/src/booking/booking.gateway.ts`
   - Gắn `@UseGuards(WsJwtGuard)`.
   - Trong `select_seat`, lấy trực tiếp `userId = client.data.user.sub`.
3. **Vá lỗ hổng IDOR:** `apps/api/src/payment/payment.controller.ts`
   - Thêm điều kiện kiểm tra `booking.userId === req.user.id`.
4. **Cấu hình CORS an toàn:** `apps/api/src/main.ts` & `booking.gateway.ts`
   - Chỉ chấp nhận domain trong whitelist.
5. **Thêm Throttler cho Auth:** `apps/api/src/auth/auth.controller.ts`
   - Giới hạn 5 lần/phút cho đăng nhập.

---

### BƯỚC 2: KHẮC PHỤC LUỒNG ĐẶT VÉ & THANH TOÁN (Booking & Payment Flow)
1. **Sửa Booking Service:** `apps/api/src/booking/booking.service.ts`
   - Xóa bỏ fallback user.
   - Tính đúng giá theo Seat Type: `VIP` (+50%), `SWEETBOX` (+100%).
   - Bổ sung check an toàn khi Redis không khả dụng.
2. **Cập nhật Webhook & DB:** `apps/api/src/payment/payment.service.ts`
   - Đổi trạng thái booking thành `PAID`.
   - Chuyển trạng thái ghế sang `BOOKED`.
3. **Frontend Checkout Fix:** `apps/web/src/app/checkout/page.tsx`
   - Xóa bỏ dòng `const token = 'dummy-token'`.
   - Truyền token thực tế từ hook `useAuth()`.
4. **Frontend SeatGrid Fix:** `apps/web/src/components/movies/SeatGrid.tsx`
   - Lấy `currentUserId` từ prop truyền vào, loại bỏ việc tự sinh ngẫu nhiên `user-xxx`.

---

### BƯỚC 3: GIAO DIỆN, THƯƠNG HIỆU & NẠP DỮ LIỆU (UI/UX & Data Seed)
1. **Tạo trang Đăng ký:** `apps/web/src/app/auth/register/page.tsx`
   - Form đăng ký chuẩn UI Dark Mode, đồng bộ style với trang login.
2. **Đổi tên thương hiệu:** `packages/shared/index.ts`
   - Đổi `CINEMA_APP_NAME = "CoiCine"`.
3. **Viết Script Seed Dữ liệu chuẩn:** `apps/api/src/scripts/seed-data.ts`
   - Nạp các phim bom tấn: Conan, Spider-Man, The Odyssey, Dune 2.
   - Nạp suất chiếu dày đặc trong 7 ngày tới.
   - Chạy lệnh seed vào database Supabase.
4. **Tối ưu Chatbot AI:** `apps/api/src/ai/ai.service.ts`
   - Rút gọn history: `take: 10`.
   - Cập nhật prompt chống lặp câu trả lời cũ.

---

### BƯỚC 4: TỐI ƯU HÓA & KIỂM THỬ TỔNG THỂ (Testing & Verification)
1. Chạy `pnpm build` toàn monorepo để bảo đảm không có lỗi type.
2. Chạy test kịch bản đặt vé hoàn chỉnh 2 người dùng đồng thời trên 2 trình duyệt.
3. Test chatbot AI với câu hỏi ngữ cảnh mới.
4. Cập nhật `CONTEXT.md` đóng Phase 6 để sẵn sàng bước sang Phase 7 (Admin Dashboard).
