# Checklist Phase 4: Real-time Seat Booking System
# Kiểm tra Giai đoạn 4: Hệ thống Đặt ghế (Real-time)

- [x] Cấu hình Socket.io Gateway (NestJS)
- [x] Setup Socket.io Client & Context (Next.js)
- [x] API lấy danh sách ghế theo Suất chiếu (Showtime)
- [x] UI Sơ đồ ghế (Grid rendering)
- [x] Logic Lock ghế tạm thời bằng Redis (SETNX)
- [x] WebSocket event: `seat_selecting` (Broadcast cho User khác)
- [x] WebSocket event: `seat_locked` (Giữ ghế tạm thời)
- [x] Xử lý Timeout giải phóng ghế (Redis TTL)
- [x] Logic Pulse animations cho Selecting seats
- [x] Xử lý Edge Case: User thoát đột ngột (Socket disconnect lock cleanup)
