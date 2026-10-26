# 15. Roadmap & Phased Execution

## Phase 1: System Design (Week 1) - [x] COMPLETED
- **Deliverables:** Full `/docs` documentation, ERD, API specs.
- **Risk:** Thiết kế sai Schema dẫn đến khó refactor sau này.
- **Complexity:** Medium.

## Phase 2: Backend Core (Week 2-3) - [x] COMPLETED
- **Deliverables:** Auth system, Movie CRUD, DB Migrations.
- **Acceptance Criteria:** Đăng nhập thành công, Fetch được list phim từ DB.

## Phase 3: Frontend UI & Branding (Week 3-4) - [x] COMPLETED
- **Deliverables:** Landing page, Movie Detail, Dark Theme.
- **Focus:** Animation & Cinematic feel.

## Phase 4: Real-time Seat Booking (Week 4-5) - [x] COMPLETED
- **Deliverables:** Seat Grid UI, Socket.io setup, Redis Locking.
- **Risk:** Race condition, mất kết nối socket.
- **Complex:** High.

## Phase 5: Order & Payment (Week 5-6) - [x] COMPLETED
- **Deliverables:** Cart, Combo selection, Payment integration, PDF Ticket.
- **Acceptance Criteria:** Booking thành công -> Database cập nhật PAID -> Có vé gửi về.

## Phase 6: AI Integration (Week 6-7) - [x] COMPLETED
- **Deliverables:** Chat UI, OpenAI/Gemini Function calling, Recommendation system.
- **Complexity:** Medium.

## Phase 7: Admin Dashboard (Week 7-8) - [x] COMPLETED
- **Deliverables:** Quản lý Phim/Suất chiếu UI, Analytics Charts, Sơ đồ ghế và duyệt đơn vé.

## Phase 8: Optimization & Real Payments - [x] COMPLETED
- **Deliverables:** 
  - Thay thế 100% native alert/confirm sang Toast & Modal.
  - Phân hệ quản lý vé & Dashboard chi tiêu `/profile/tickets`.
  - Mở rộng 4.463 suất chiếu liên tục đến 30/06/2027 (0 collisions).
  - Tích hợp thanh toán thật VietQR Napas 247 và tài liệu `docs/PAYMENT_CONFIG.md`.
  - Khắc phục triệt để hình ảnh poster TMDB 200 OK + `CinematicPoster` fallback.

## Phase 9: Realtime Synchronization & Multi-Room Layout Polish - [x] COMPLETED
- **Deliverables:**
  - Phân trang suất chiếu theo tuần (Weekly pagination) tại trang chi tiết phim.
  - Tự động khóa và vô hiệu hóa các suất chiếu quá khứ theo thời gian thực (Frontend & Backend).
  - Hero Carousel top rated movies tự động trượt, kèm nút "Đặt vé ngay" điều hướng chính xác.
  - Loại bỏ hoàn toàn ghế trùng lặp (`dupesCount = 0`) và chuẩn hóa 3 cấu trúc rạp khác biệt (IMAX, Standard, Sweetbox).
  - Đưa shortcut "Vé của tôi" lên Navbar chính kèm animation chuyển trang Framer Motion.

## Phase 10: Production Deployment Architecture & DevOps - [x] COMPLETED
- **Deliverables:**
  - Cẩm nang toàn diện `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` (PaaS & VPS Docker Compose).
  - Cấu hình Nginx Reverse Proxy hỗ trợ WebSocket (WSS) liên tục và SSL Certbot.
  - Hỗ trợ cấu hình CORS động cho production domains trong API & WebSockets.
  - Script sao lưu tự động PostgreSQL hàng ngày và quy trình kiểm thử khói 7 bước.
